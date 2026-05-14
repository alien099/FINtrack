from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    TransactionViewSet,
    RegisterView,
    BalanceView,
    AnalyticsView,
    ExportTransactionsView,
    MeView
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('auth/register/', RegisterView.as_view()),
    path('auth/login/', TokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('balance/', BalanceView.as_view()),
    path("auth/me/", MeView.as_view()),
    path("transactions/export/", ExportTransactionsView.as_view()),
    path('analytics/', AnalyticsView.as_view()),
    path('', include(router.urls)),
]