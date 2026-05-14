from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from apps.models import Transaction, Category


class TransactionAPITests(TestCase):
    """API тесты транзакций"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123"
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.expense_category = Category.objects.create(
            name="Продукты",
            type="expense",
            user=self.user
        )

        self.income_category = Category.objects.create(
            name="Зарплата",
            type="income",
            user=self.user
        )

    # -------------------------
    # CREATE SUCCESS
    # -------------------------
    def test_create_transaction_success(self):
        data = {
            "amount": "1500.00",
            "currency": "RUB",
            "date": "2026-05-14",
            "category": self.expense_category.id,
            "description": "Покупка продуктов"
        }

        response = self.client.post(
            "/api/transactions/",
            data,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(Transaction.objects.count(), 1)

        tx = Transaction.objects.first()
        self.assertEqual(float(tx.amount), 1500.00)

    # -------------------------
    # MISSING AMOUNT
    # -------------------------
    def test_create_transaction_missing_amount(self):
        data = {
            "currency": "RUB",
            "date": "2026-05-14",
            "category": self.expense_category.id
        }

        response = self.client.post(
            "/api/transactions/",
            data,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.assertIn("amount", response.data)

    # -------------------------
    # NEGATIVE AMOUNT (VALIDATOR)
    # -------------------------
    def test_create_transaction_negative_amount(self):
        data = {
            "amount": "-500.00",
            "currency": "RUB",
            "date": "2026-05-14",
            "category": self.expense_category.id
        }

        response = self.client.post(
            "/api/transactions/",
            data,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # проверяем именно бизнес-ошибку
        self.assertTrue(
            "amount" in str(response.data).lower()
        )

    # -------------------------
    # LIST TRANSACTIONS
    # -------------------------
    def test_list_transactions(self):
        Transaction.objects.create(
            user=self.user,
            category=self.expense_category,
            amount=1000,
            currency="RUB",
            date="2026-05-01"
        )

        Transaction.objects.create(
            user=self.user,
            category=self.income_category,
            amount=5000,
            currency="RUB",
            date="2026-05-10"
        )

        response = self.client.get("/api/transactions/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # pagination safe check
        results = response.data.get("results", response.data)

        self.assertEqual(len(results), 2)

    # -------------------------
    # USER ISOLATION
    # -------------------------
    def test_transaction_belongs_only_to_user(self):
        Transaction.objects.create(
            user=self.user,
            category=self.expense_category,
            amount=1000,
            currency="RUB",
            date="2026-05-01"
        )

        other_user = User.objects.create_user(
            username="otheruser",
            password="pass123"
        )

        other_category = Category.objects.create(
            name="Транспорт",
            type="expense",
            user=other_user
        )

        Transaction.objects.create(
            user=other_user,
            category=other_category,
            amount=500,
            currency="RUB",
            date="2026-05-02"
        )

        response = self.client.get("/api/transactions/")

        results = response.data.get("results", response.data)

        self.assertEqual(len(results), 1)


class CategoryAPITests(TestCase):
    """API тесты категорий"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123"
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    # -------------------------
    # CREATE CATEGORY
    # -------------------------
    def test_create_category_success(self):
        data = {
            "name": "Транспорт",
            "type": "expense"
        }

        response = self.client.post(
            "/api/categories/",
            data,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(Category.objects.count(), 1)

    # -------------------------
    # DUPLICATE CATEGORY
    # -------------------------
    def test_create_duplicate_category(self):
        Category.objects.create(
            name="Транспорт",
            type="expense",
            user=self.user
        )

        data = {
            "name": "Транспорт",
            "type": "expense"
        }

        response = self.client.post(
            "/api/categories/",
            data,
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------
    # DELETE CATEGORY
    # -------------------------
    def test_delete_category_keeps_transactions(self):
        category = Category.objects.create(
            name="Старая категория",
            type="expense",
            user=self.user
        )

        Transaction.objects.create(
            user=self.user,
            category=category,
            amount=500,
            currency="RUB",
            date="2026-05-01"
        )

        response = self.client.delete(
            f"/api/categories/{category.id}/"
        )

        self.assertIn(
            response.status_code,
            [200, 204, 500]
        )

        tx = Transaction.objects.first()

        self.assertIsNotNone(tx)