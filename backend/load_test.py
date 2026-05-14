import requests
import time
import threading
from datetime import datetime

# Настройки
BASE_URL = "http://127.0.0.1:8000/api"
NUM_USERS = 20          # Количество виртуальных пользователей
REQUESTS_PER_USER = 10  # Запросов от каждого пользователя

# Сбор статистики
results = {
    "transactions_list": [],
    "categories_list": [],
    "create_transaction": [],
    "analytics": [],
    "balance": [],
    "errors": 0
}


def format_ms(seconds):
    """Перевод секунд в миллисекунды."""
    return round(seconds * 1000, 2)


def load_user(user_id):
    """
    Имитация действий одного пользователя.
    """
    session = requests.Session()

    # Регистрация
    session.post(f"{BASE_URL}/auth/register/", json={
        "username": f"loaduser_{user_id}",
        "email": f"loaduser_{user_id}@test.com",
        "password": "testpass123",
        "password2": "testpass123"
    })

    # Авторизация
    login_resp = session.post(f"{BASE_URL}/auth/login/", json={
        "username": f"loaduser_{user_id}",
        "password": "testpass123"
    })

    if login_resp.status_code != 200:
        results["errors"] += 1
        return

    token = login_resp.json().get("access", "")
    headers = {"Authorization": f"Bearer {token}"}

    # Создаём категорию для тестов
    cat_resp = session.post(f"{BASE_URL}/categories/", json={
        "name": f"Тестовая_{user_id}",
        "type": "expense"
    }, headers=headers)
    category_id = cat_resp.json().get("id") if cat_resp.status_code == 201 else None

    # Выполняем серию запросов
    for _ in range(REQUESTS_PER_USER):
        # 1. Получение списка транзакций
        start = time.time()
        resp = session.get(f"{BASE_URL}/transactions/", headers=headers)
        results["transactions_list"].append(time.time() - start)
        if resp.status_code != 200:
            results["errors"] += 1

        # 2. Получение списка категорий
        start = time.time()
        resp = session.get(f"{BASE_URL}/categories/", headers=headers)
        results["categories_list"].append(time.time() - start)
        if resp.status_code != 200:
            results["errors"] += 1

        # 3. Создание транзакции
        if category_id:
            start = time.time()
            resp = session.post(f"{BASE_URL}/transactions/", json={
                "amount": "1500.00",
                "currency": "RUB",
                "date": "2026-05-15",
                "category": category_id,
                "description": "Нагрузочный тест"
            }, headers=headers)
            results["create_transaction"].append(time.time() - start)
            if resp.status_code not in [200, 201]:
                results["errors"] += 1

        # 4. Получение аналитики (самый тяжёлый запрос)
        start = time.time()
        resp = session.get(f"{BASE_URL}/analytics/", headers=headers)
        results["analytics"].append(time.time() - start)
        if resp.status_code != 200:
            results["errors"] += 1

        # 5. Получение баланса
        start = time.time()
        resp = session.get(f"{BASE_URL}/balance/", headers=headers)
        results["balance"].append(time.time() - start)
        if resp.status_code != 200:
            results["errors"] += 1


def print_stats(name, times):
    """Вывод статистики по эндпоинту."""
    if not times:
        print(f"  {name}: нет данных")
        return

    times_ms = [format_ms(t) for t in times]
    avg = sum(times_ms) / len(times_ms)
    sorted_times = sorted(times_ms)
    median = sorted_times[len(sorted_times) // 2]
    p95 = sorted_times[int(len(sorted_times) * 0.95)]

    print(f"  {name}:")
    print(f"    Запросов: {len(times)}")
    print(f"    Среднее: {avg:.2f} мс")
    print(f"    Медиана: {median:.2f} мс")
    print(f"    95-й процентиль: {p95:.2f} мс")
    print()


# ====== ЗАПУСК ======
print("=" * 60)
print("НАГРУЗОЧНОЕ ТЕСТИРОВАНИЕ FINTRACK API")
print(f"Пользователей: {NUM_USERS}")
print(f"Запросов от каждого: {REQUESTS_PER_USER}")
print(f"Всего запросов к каждому эндпоинту: {NUM_USERS * REQUESTS_PER_USER}")
print("=" * 60)
print()

start_time = time.time()

# Запуск потоков
threads = []
for i in range(NUM_USERS):
    t = threading.Thread(target=load_user, args=(i,))
    threads.append(t)
    t.start()
    time.sleep(0.1)  # Небольшая задержка между пользователями

# Ожидание завершения всех потоков
for t in threads:
    t.join()

total_time = time.time() - start_time

# ====== РЕЗУЛЬТАТЫ ======
print()
print("=" * 60)
print("РЕЗУЛЬТАТЫ")
print("=" * 60)
print(f"Общее время теста: {total_time:.2f} сек")
print(f"Ошибок: {results['errors']}")
print()

print_stats("GET /api/transactions/", results["transactions_list"])
print_stats("GET /api/categories/", results["categories_list"])
print_stats("POST /api/transactions/", results["create_transaction"])
print_stats("GET /api/analytics/", results["analytics"])
print_stats("GET /api/balance/", results["balance"])

print("=" * 60)
print("ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
print("=" * 60)