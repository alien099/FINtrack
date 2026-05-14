from django.conf import settings
from django.db.models import Sum, F, Q
from django.db import models
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from openpyxl import Workbook

from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Category, Transaction, Budget
from .serializers import (
    CategorySerializer,
    TransactionSerializer,
    BudgetSerializer,
    RegisterSerializer
)

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "username": request.user.username
        })
    
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(
            models.Q(user=self.request.user) |
            models.Q(is_default=True)
        ).order_by("name")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()

        if category.is_default:
            return Response(
                {"error": "Нельзя удалить стандартную категорию"},
                status=400
            )

        fallback_id = settings.FALLBACK_IDS.get(category.type)

        if not fallback_id:
            return Response(
                {"error": f"Нет fallback для типа {category.type}"},
                status=500
            )

        try:
            fallback = Category.objects.get(id=fallback_id)
        except Category.DoesNotExist:
            return Response(
                {"error": "Fallback категория не найдена в базе"},
                status=500
            )

        Transaction.objects.filter(
            category=category,
            user=request.user
        ).update(category=fallback)

        Budget.objects.filter(
            category=category,
            user=request.user
        ).update(category=fallback)

        category.delete()

        return Response(status=204)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user)

        start = self.request.query_params.get("date_from")
        end = self.request.query_params.get("date_to")
        ttype = self.request.query_params.get("type")
        categories = self.request.query_params.get("categories")

        if start:
            qs = qs.filter(date__gte=start)

        if end:
            qs = qs.filter(date__lte=end)

        if ttype:
            qs = qs.filter(category__type=ttype)

        if categories:
            category_ids = [int(x) for x in categories.split(",") if x.isdigit()]
            qs = qs.filter(category_id__in=category_ids)

        return qs.order_by("-date", "-id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ExportTransactionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user)

        wb = Workbook()
        ws = wb.active

        ws.append(["Дата", "Категория", "Сумма", "Валюта", "Тип", "Описание"])

        for t in transactions:
            ws.append([
                t.date.strftime("%d.%m.%Y"),
                t.category.name if t.category else "",
                float(t.amount),
                t.currency,
                t.category.type if t.category else "",
                t.description
            ])

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="transactions.xlsx"'

        wb.save(response)
        return response


class BalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Transaction.objects.filter(user=request.user)

        income = qs.filter(category__type='income').aggregate(
            total=Sum('amount')
        )['total'] or 0

        expense = qs.filter(category__type='expense').aggregate(
            total=Sum('amount')
        )['total'] or 0

        return Response({
            "balance": income - expense,
            "income": income,
            "expense": expense
        })

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Transaction.objects.filter(user=request.user)

        start = request.query_params.get("date_from")
        end = request.query_params.get("date_to")

        if start:
            qs = qs.filter(date__gte=start)
        if end:
            qs = qs.filter(date__lte=end)

        monthly = (
            qs.annotate(month=TruncMonth("date"))
            .values("month")
            .annotate(
                income=Sum("amount", filter=Q(category__type="income")),
                expense=Sum("amount", filter=Q(category__type="expense")),
            )
            .order_by("month")
        )

        expense_structure = (
            qs.filter(category__type="expense")
            .values(name=F("category__name"))
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )

        income_structure = (
            qs.filter(category__type="income")
            .values(name=F("category__name"))
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )

        return Response({
            "monthly": list(monthly),
            "expense_structure": list(expense_structure),
            "income_structure": list(income_structure),
        })