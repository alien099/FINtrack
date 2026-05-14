import React, { useEffect, useState, useMemo, useCallback } from "react";
import DateRangeFilter from "../components/DateRangeFilter";
import MultiSelect from "../components/MultiSelect";
import TypeSelect from "../components/TypeSelect";
import api from "../api";
import "./Transactions.css";

function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const getCategoryName = (t) => {
  if (t.category_name?.trim()) {
    return t.category_name;
  }

  if (t.category_type === "income") {
    return "Прочие доходы";
  }

  if (t.category_type === "expense") {
    return "Прочие расходы";
  }

  return "Без категории";
};

  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc"
  });

  const [filters, setFilters] = useState({
    date_from: "",
    date_to: "",
    categories: [],
    type: ""
  });

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        type: filters.type || undefined,
        categories:
          filters.categories.length > 0
            ? filters.categories.join(",")
            : undefined
      };

      const res = await api.get("transactions/", { params });
      setTransactions(res.data.results || []);
      setPage(1);
    } catch (e) {
      console.error("Transactions error:", e);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("categories/");
      setCategories(res.data.results || res.data || []);
    } catch (e) {
      console.error("Categories error:", e);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions];

    sorted.sort((a, b) => {
      const key = sortConfig.key;

      let valA = a[key];
      let valB = b[key];

      if (key === "amount") {
        valA = Number(a.amount);
        valB = Number(b.amount);
      }

      if (key === "date") {
        valA = new Date(a.date);
        valB = new Date(b.date);
      }

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;

      return 0;
    });

    return sorted;
  }, [transactions, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc"
          ? "desc"
          : "asc"
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("ru-RU");

  const formatAmount = (a, currency = "RUB") =>
    new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency
    }).format(a);

  const exportToExcel = async () => {
    try {
      const res = await api.get("transactions/export/", {
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", "transactions.xlsx");

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Export error:", e);
    }
  };

  const total = sortedTransactions.length;

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTransactions.slice(start, start + pageSize);
  }, [sortedTransactions, page]);

return (
  <div className="page">

    <h1>Список транзакций</h1>

    <div className="card-bar">
        <DateRangeFilter
          from={filters.date_from}
          to={filters.date_to}
          onFromChange={(value) =>
            setFilters({
              ...filters,
              date_from: value
            })
          }
          onToChange={(value) =>
            setFilters({
              ...filters,
              date_to: value
            })
          }
        />

      <MultiSelect
        options={categories}
        value={filters.categories}
        onChange={(val) =>
          setFilters((prev) => ({
            ...prev,
            categories: val
          }))
        }
        placeholder="Категории"
      />

      <TypeSelect
        value={filters.type}
        onChange={(val) =>
          setFilters((prev) => ({
            ...prev,
            type: val
          }))
        }
      />

      <button
        className="reset"
        onClick={() =>
          setFilters({
            date_from: "",
            date_to: "",
            categories: [],
            type: ""
          })
        }
      >
        Сброс
      </button>

      <button onClick={exportToExcel}>
        Экспорт
      </button>
    </div>

    <div className="table-wrapper">

      <table className="transactions-table">
        <thead>
          <tr>
            <th>Категория</th>
            <th>Комментарий</th>
            <th onClick={() => handleSort("date")}>
              Дата {getSortIcon("date")}
            </th>
            <th onClick={() => handleSort("amount")}>
              Сумма {getSortIcon("amount")}
            </th>
            <th>Тип</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr><td colSpan="4">Загрузка...</td></tr>
          ) : total === 0 ? (
            <tr><td colSpan="4">Нет данных</td></tr>
          ) : (
            paginated.map((t) => (
              <tr key={t.id}>
                <td>
                  {getCategoryName(t)}
                </td>

                <td>{t.description}</td>

                <td>{formatDate(t.date)}</td>

                <td className="amount">
                  {t.category_type === "income" ? "+" : "-"}
                  {formatAmount(t.amount, t.currency)}
                </td>

                <td>
                  {t.category_type ? (
                    <span className={t.category_type}>
                      {t.category_type === "income" ? "Доход" : "Расход"}
                    </span>
                  ) : (
                    <span className="missing-type">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

    </div>

    <div className="table-footer">
      <div>Показано {paginated.length} из {total}</div>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>{"<"}</button>
        <button disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)}>{">"}</button>
      </div>
    </div>

  </div>
);
}

export default TransactionsPage;