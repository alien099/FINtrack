from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.models import Transaction, Category


class AuthIntegrationTests(TestCase):
    """Интеграционные тесты: регистрация + авторизация + доступ к API."""

    def setUp(self):
        self.client = APIClient()

    def test_full_auth_flow(self):
        """
        Проверка полного цикла:
        регистрация -> вход -> получение токена -> доступ к защищённому ресурсу.
        """
        # Шаг 1: Регистрация нового пользователя
        register_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepass123",
            "password2": "securepass123"
        }
        response = self.client.post(
            "/api/auth/register/", register_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Шаг 2: Авторизация и получение JWT-токенов
        login_data = {
            "username": "newuser",
            "password": "securepass123"
        }
        response = self.client.post(
            "/api/auth/login/", login_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        access_token = response.data["access"]

        # Шаг 3: Доступ к защищённому ресурсу с токеном
        auth_client = APIClient()
        auth_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {access_token}"
        )
        response = auth_client.get("/api/transactions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_access_without_token_returns_401(self):
        """Проверка отказа в доступе без токена."""
        response = self.client.get("/api/transactions/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TransactionLifecycleTests(TestCase):
    """Интеграционные тесты: полный жизненный цикл транзакции."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_and_list_transaction(self):
        """
        Создание категории и транзакции,
        затем проверка отображения транзакции в списке и корректности данных.
        """
        # Шаг 1: Создание категории
        cat_data = {"name": "Продукты", "type": "expense"}
        cat_response = self.client.post(
            "/api/categories/", cat_data, format="json"
        )
        self.assertEqual(cat_response.status_code, status.HTTP_201_CREATED)
        category_id = cat_response.data["id"]

        # Шаг 2: Создание транзакции (тип определяется через категорию)
        tx_data = {
            "amount": "2500.50",
            "currency": "RUB",
            "date": "2026-05-15",
            "category": category_id,
            "description": "Покупка в супермаркете"
        }
        tx_response = self.client.post(
            "/api/transactions/", tx_data, format="json"
        )
        self.assertEqual(tx_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(tx_response.data["amount"]), 2500.50)

        # Шаг 3: Проверка списка транзакций
        list_response = self.client.get("/api/transactions/")
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data["results"]), 1)

        # Шаг 4: Проверка содержимого транзакции в списке
        tx_in_list = list_response.data["results"][0]
        self.assertEqual(tx_in_list["amount"], "2500.50")
        self.assertEqual(tx_in_list["description"], "Покупка в супермаркете")


class CategoryDeleteIntegrationTests(TestCase):
    """Интеграционные тесты: удаление категории с fallback-логикой."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_delete_category_preserves_transactions(self):
        """
        При удалении категории связанные транзакции
        не должны удаляться, а должны переназначаться.
        """
        # Шаг 1: Создаём категорию и транзакцию
        category = Category.objects.create(
            name="Старая категория", type="expense", user=self.user
        )
        Transaction.objects.create(
            user=self.user,
            category=category,
            amount=1000,
            currency="RUB",
            date="2026-05-15"
        )

        # Шаг 2: Удаляем категорию
        response = self.client.delete(
            f"/api/categories/{category.id}/"
        )
        self.assertIn(
            response.status_code,
            [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]
        )

        # Шаг 3: Проверяем, что транзакция сохранена
        transactions = Transaction.objects.filter(user=self.user)
        self.assertEqual(transactions.count(), 1)


class AnalyticsIntegrationTests(TestCase):
    """Интеграционные тесты: формирование аналитики."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_analytics_returns_correct_data(self):
        """
        Создание нескольких транзакций и проверка корректности
        агрегированных аналитических данных.
        """
        # Шаг 1: Создаём категории и транзакции
        food_cat = Category.objects.create(
            name="Еда", type="expense", user=self.user
        )
        transport_cat = Category.objects.create(
            name="Транспорт", type="expense", user=self.user
        )

        Transaction.objects.create(
            user=self.user,
            category=food_cat,
            amount=5000,
            currency="RUB",
            date="2026-05-01"
        )
        Transaction.objects.create(
            user=self.user,
            category=transport_cat,
            amount=3000,
            currency="RUB",
            date="2026-05-10"
        )
        Transaction.objects.create(
            user=self.user,
            category=None,
            amount=20000,
            currency="RUB",
            date="2026-05-15"
        )

        # Шаг 2: Запрашиваем аналитику
        response = self.client.get("/api/analytics/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Шаг 3: Проверяем структуру ответа
        data = response.data
        self.assertIn("monthly", data)
        self.assertIn("expense_structure", data)
        self.assertIn("income_structure", data)

        # Шаг 4: Проверяем, что общая сумма расходов = 8000
        total_expense = sum(
            item["total"] for item in data["expense_structure"]
        )
        self.assertEqual(total_expense, 8000)