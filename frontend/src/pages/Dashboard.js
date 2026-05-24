import React, { useEffect, useState, useMemo } from "react";
import AccountSelector from "../components/AccountSelector";
import TransferModal from "../components/TransferModal";
import CategorySelect from "../components/CategorySelect";
import api from "../api";
import "../styles/Dashboard.css";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [toast, setToast] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  
  const getCategoryName = (t) => {
    if (t.category_name?.trim()) return t.category_name;
    return t.category_type === "income" ? "Прочие доходы" : "Прочие расходы";
  };

  const getAccountName = (t) => {
    return t.account_name || "—";
  };

  const getCurrentMonthName = () => {
    return new Date().toLocaleDateString("ru-RU", { month: "long" });
  };

  const [form, setForm] = useState({
    amount: "",
    category: "",
    account: "",
    type: "income",
    date: new Date().toISOString().split("T")[0],
    description: ""
  });

  const [adding, setAdding] = useState(false);

  const getMonthRange = () => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  };

  const monthlyExpenses = useMemo(() => {
    const { start, end } = getMonthRange();

    return transactions
      .filter(t =>
        t.category_type === "expense" &&
        new Date(t.date) >= start &&
        new Date(t.date) <= end
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  const monthlyIncome = useMemo(() => {
    const { start, end } = getMonthRange();

    return transactions
      .filter(t =>
        t.category_type === "income" &&
        new Date(t.date) >= start &&
        new Date(t.date) <= end
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  const getBudgetKey = () => {
    const now = new Date();
    return `budget_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  const getBudget = () => {
    const now = new Date();
    const currentKey = getBudgetKey();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    const prevKey = `budget_${prevMonth.getFullYear()}_${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
    return Number(localStorage.getItem(currentKey) || localStorage.getItem(prevKey) || 0);
  };

  const saveBudget = (value) => {
    localStorage.setItem(getBudgetKey(), String(value));
  };

  const [budget, setBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState("");
  const [editingBudget, setEditingBudget] = useState(false);
  const isOverBudget = monthlyExpenses > budget;
  const monthDelta = monthlyIncome - monthlyExpenses;

  const groupedTransactions = useMemo(() => {
    const groups = {};
    transactions.forEach(t => {
      const date = new Date(t.date).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });

    const sorted = Object.entries(groups).sort((a, b) => {
      return new Date(b[0]) - new Date(a[0]);
    });

    return sorted.slice(0, 3);
  }, [transactions]);

  const formatDatePretty = (date) =>
    new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    
  const formatAmount = (num, decimals = 2) => {
    if (num === null || num === undefined || num === "") return "0";

    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(Number(num));
  };

  useEffect(() => {
    setBudget(getBudget());
  }, []);

  useEffect(() => {
    loadDashboard();
  }, []);

  const [formError, setFormError] = useState("");
  const currentMonthTransactions = useMemo(() => {
    const { start, end } = getMonthRange();

    return transactions.filter(
      t =>
        new Date(t.date) >= start &&
        new Date(t.date) <= end
    );
  }, [transactions]);

  const topExpenseCategory = useMemo(() => {
    const grouped = {};

    currentMonthTransactions
      .filter(t => t.category_type === "expense")
      .forEach(t => {
        const name = getCategoryName(t);

        grouped[name] =
          (grouped[name] || 0) + Number(t.amount);
      });

    let top = {
      name: "Нет данных",
      amount: 0
    };

    Object.entries(grouped).forEach(([name, amount]) => {
      if (amount > top.amount) {
        top = { name, amount };
      }
    });

    return top;
  }, [currentMonthTransactions]);

 const loadDashboard = async () => {
    try {
      const [bal, tx, cat] = await Promise.all([
        api.get("balance/"),
        api.get("transactions/"),
        api.get("categories/")
      ]);
      setBalance(bal.data);
      setTransactions(Array.isArray(tx.data) ? tx.data : (tx.data.results || []));
      setCategories(Array.isArray(cat.data) ? cat.data : (cat.data.results || []));
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text) => {
    setToast(text);

    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  const handleAdd = async () => {

    if (!form.amount || Number(form.amount) <= 0) {
      setFormError("Введите корректную сумму");
      return;
    }

    if (!form.category) {
      setFormError("Выберите категорию");
      return;
    }

    if (!form.account) {
          setFormError("Выберите счет");
          return;
        }

    if (!form.date) {
      setFormError("Выберите дату");
      return;
    }

    try {
      setAdding(true);
      setFormError("");

      await api.post("transactions/", {
        ...form,
        currency: "RUB"
      });

      await loadDashboard();

      showToast("Операция успешно добавлена");

      setForm({
        amount: "",
        category: "",
        type: "income",
        date: new Date().toISOString().split("T")[0],
        description: ""
      });

    } catch (err) {
      showToast("Ошибка при добавлении операции");
    } finally {
      setAdding(false);
    }
  };

  const isFormValid =
  form.account &&
  form.amount &&
  Number(form.amount) > 0 &&
  form.category &&
  form.date;

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="page">

      <div className="kpi-row">

        <div className="kpi">
          <div className="kpi-left">
            <span className="kpi-title">Баланс</span>
            <h2>{formatAmount(balance.balance, 0)} ₽</h2>

            <div className={`kpi-sub ${monthDelta >= 0 ? "plus" : "minus"}`}>
              {monthDelta >= 0 ? "+" : ""}
              {formatAmount(monthDelta, 0)} ₽
              <span> за этот месяц</span>
            </div>
          </div>

          <img className="kpi-icon" src="/img/balance.png" alt="" />
        </div>


        <div className="kpi">
          <div className="kpi-left">
            <span className="kpi-title">Бюджет на {getCurrentMonthName()}</span>
            <h2>{formatAmount(budget, 0)} ₽</h2>

            <div className={`kpi-sub ${isOverBudget ? "minus" : "plus"}`}>
              <span>План расходов</span>
              {isOverBudget ? " превышен" : " не превышен"}
            </div>
          </div>

          <img className="kpi-icon" src="/img/budget.png" alt="" />
        </div>


        <div className="kpi">
          <div className="kpi-left">
            <span className="kpi-title">Доходы за {getCurrentMonthName()}</span>
            <h2>{formatAmount(monthlyIncome, 0)} ₽</h2>
          </div>

          <img className="kpi-icon" src="/img/income.png" alt="" />
        </div>


        <div className="kpi">
          <div className="kpi-left">
            <span className="kpi-title">Расходы за {getCurrentMonthName()}</span>
            <h2>{formatAmount(monthlyExpenses, 0)} ₽</h2>
          </div>

          <img className="kpi-icon" src="/img/expences.png" alt="" />
        </div>

      </div>


      <div className="main-grid">

        <div className="left-column">

          <div className="card form-card">
            
            <h3 className="form-title">
              Добавление операции
            </h3>

            <div className="toggle">

              <button
                className={form.type === "income" ? "active income" : "income"}
                onClick={() => setForm({ ...form, type: "income" })}
              >
                Доход
              </button>

              <button
                className={form.type === "expense" ? "active expense" : "expense"}
                onClick={() => setForm({ ...form, type: "expense" })}
              >
                Расход
              </button>

            </div>

            <div className="form-grid">

              <input
                placeholder="Сумма"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: e.target.value })
                }
              />

              <AccountSelector
                value={form.account}
                onChange={(id) => setForm({ ...form, account: id })}
              />

              <input
                placeholder="Комментарий"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              
              <CategorySelect
                value={form.category}
                onChange={(id) => setForm({ ...form, category: id })}
                type={form.type}
              />

              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({ ...form, date: e.target.value })
                }
              />

            </div>

            <button
              className="primary"
              onClick={handleAdd}
              disabled={adding || !isFormValid}
            >
              {adding ? "Добавление..." : "Добавить"}
            </button>

            {formError && (
              <div className="form-error">
                {formError}
              </div>
            )}

            {successMessage && (
            <div className="form-success">
              {successMessage}
            </div>
            )}

          </div>

          <button className="transfer-btn" onClick={() => setShowTransfer(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <polyline points="19 12 12 19 5 12"/>
            </svg>
            Перевод между счетами
          </button>

          <div className="card budget-card">

            {!editingBudget ? (

              <div className="budget-row">
                <div className="budget-info">
                  <span className="kpi-title">
                    Бюджет на {getCurrentMonthName()}
                  </span>
                  <h2>{formatAmount(budget, 0)} ₽</h2>
                </div>

                <button
                  className="budget-change-btn"
                  onClick={() => {
                    setBudgetInput(budget);
                    setEditingBudget(true);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    <path d="m15 5 4 4"/>
                  </svg>
                  Изменить
                </button>
              </div>

            ) : (

              <div className="budget-edit-row">
                <input
                  type="number"
                  className="budget-input"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  autoFocus
                />

                <button
                  className="budget-save-btn"
                  onClick={() => {
                    const val = Number(budgetInput || 0);
                    setBudget(val);
                    saveBudget(val);
                    setEditingBudget(false);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>

                <button
                  className="budget-cancel-btn"
                  onClick={() => setEditingBudget(false)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

            )}

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="right-column card feed">

          <h3>Последние операции</h3>

          <div className="feed-scroll">
            {groupedTransactions.length === 0 ? (
              <div className="empty-state">Нет операций</div>
            ) : (
              groupedTransactions.map(([date, items]) => (
                <div key={date} className="day-group">
                  <div className="day-label">{formatDatePretty(date)}</div>
                  {items.map(t => (
                    <div key={t.id} className="feed-item">
                      <div className="feed-left">
                        <span className="feed-account">{getAccountName(t)}</span>
                        <span className="feed-category">{getCategoryName(t)}</span>
                      </div>
                      <div className={`feed-amount ${t.category_type}`}>
                        {t.category_type === "income" ? "+" : "-"}
                        {formatAmount(t.amount, 2)} ₽
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

        </div>

      </div>

       {showTransfer && (
        <TransferModal
          onClose={() => setShowTransfer(false)}
          onSuccess={() => {
            setShowTransfer(false);
            loadDashboard();
            showToast("Перевод выполнен");
          }}
          showToast={showToast}
        />
      )}

      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}

    </div>
  );
}

export default Dashboard;