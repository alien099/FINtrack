import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import DateRangeFilter from "../components/DateRangeFilter";
import MultiSelect from "../components/MultiSelect";
import TypeSelect from "../components/TypeSelect";
import AccountSelector from "../components/AccountSelector";
import api from "../api";
import "../styles/Transactions.css";

const MIN_PAGE_SIZE = 5;
const ROW_HEIGHT = 44;

function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);
  const tableContainerRef = useRef(null);

  const [pageSize, setPageSize] = useState(10);

  // Динамический расчёт pageSize
  useEffect(() => {
    const calcPageSize = () => {
      const vh = window.innerHeight;
      const tableTop = tableContainerRef.current?.getBoundingClientRect()?.top || 300;
      const footerH = 60;
      const availableH = vh - tableTop - footerH;
      const rows = Math.floor(availableH / ROW_HEIGHT);
      setPageSize(Math.max(MIN_PAGE_SIZE, rows - 1));
    };

    calcPageSize();
    window.addEventListener("resize", calcPageSize);
    return () => window.removeEventListener("resize", calcPageSize);
  }, []);

  const getCategoryName = (t) => {
    if (t.category_name?.trim()) return t.category_name;
    if (t.category_type === "income") return "Прочие доходы";
    if (t.category_type === "expense") return "Прочие расходы";
    return "Без категории";
  };

  const getAccountName = (t) => {
    return t.account_name || "—";
  };

  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc"
  });

  const [filters, setFilters] = useState({
    date_from: "",
    date_to: "",
    categories: [],
    type: "",
    account: ""
  });

  const [page, setPage] = useState(1);

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        type: filters.type || undefined,
        categories: filters.categories.length > 0 ? filters.categories.join(",") : undefined,
        account: filters.account || undefined,
        no_page: 1
      };
      const res = await api.get("transactions/", { params });
      setTransactions(res.data.results || res.data || []);
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
      if (key === "amount") { valA = Number(a.amount); valB = Number(b.amount); }
      if (key === "date") { valA = new Date(a.date); valB = new Date(b.date); }
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [transactions, sortConfig]);

  const total = sortedTransactions.length;
  const totalPages = Math.ceil(total / pageSize);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTransactions.slice(start, start + pageSize);
  }, [sortedTransactions, page, pageSize]);

  // Сброс страницы при смене фильтров или pageSize
  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("ru-RU");

  const formatAmount = (a, currency = "RUB") =>
    new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(a);

  const exportToExcel = async () => {
    try {
      const res = await api.get("transactions/export/", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "transactions.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      showToast("Ошибка экспорта");
    }
  };

  const downloadTemplate = async () => {
    try {
      const res = await api.get("transactions/template/", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "template_import.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Шаблон скачан");
    } catch (e) {
      showToast("Ошибка скачивания шаблона");
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("transactions/import/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setImportResult(res.data);
      setFilters({ date_from: "", date_to: "", categories: [], type: "", account: "" });
      showToast(`Импортировано: ${res.data.imported}`);
      if (res.data.errors?.length > 0) {
        setTimeout(() => {
          alert(`Ошибки при импорте:\n${res.data.errors.join("\n")}`);
        }, 500);
      }
    } catch (e) {
      showToast("Ошибка импорта");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Генерация кнопок страниц
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 2) end = Math.min(4, totalPages - 1);
      if (page >= totalPages - 1) start = Math.max(totalPages - 3, 2);

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="page">
      <h1>Список транзакций</h1>

      <div className="card-bar">
        <DateRangeFilter
          from={filters.date_from}
          to={filters.date_to}
          onFromChange={(value) => setFilters({ ...filters, date_from: value })}
          onToChange={(value) => setFilters({ ...filters, date_to: value })}
        />
        <AccountSelector
          value={filters.account}
          onChange={(val) => setFilters((prev) => ({ ...prev, account: val }))}
          showAll
        />
        <MultiSelect
          options={categories}
          value={filters.categories}
          onChange={(val) => setFilters((prev) => ({ ...prev, categories: val }))}
          placeholder="Категории"
        />
        <TypeSelect
          value={filters.type}
          onChange={(val) => setFilters((prev) => ({ ...prev, type: val }))}
        />
        <button className="reset-icon"
          onClick={() => setFilters({ date_from: "", date_to: "", categories: [], type: "", account: "" })}
          title="Сбросить фильтры">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
        <button onClick={exportToExcel}>Экспорт</button>
        <button onClick={downloadTemplate} title="Скачать шаблон">Шаблон</button>
        <button onClick={() => fileInputRef.current?.click()} title="Импорт">Импорт</button>
        <input ref={fileInputRef} type="file" accept=".xlsx" style={{ display: "none" }} onChange={handleImport} />
      </div>

      <div className="table-wrapper" ref={tableContainerRef}>
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Счет</th>
              <th>Категория</th>
              <th>Комментарий</th>
              <th onClick={() => handleSort("date")}>Дата {getSortIcon("date")}</th>
              <th onClick={() => handleSort("amount")}>Сумма {getSortIcon("amount")}</th>
              <th>Тип</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="empty">Загрузка...</td></tr>
            ) : total === 0 ? (
              <tr><td colSpan="6" className="empty">Нет данных</td></tr>
            ) : (
              paginated.map((t) => (
                <tr key={t.id}>
                  <td>{getAccountName(t)}</td>
                  <td>{getCategoryName(t)}</td>
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

      {totalPages > 1 && (
        <div className="table-footer">
          <div>Строк: {total}</div>
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>{"<"}</button>
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="pagination-dots">…</span>
              ) : (
                <button
                  key={p}
                  className={page === p ? "active" : ""}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            )}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>{">"}</button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default TransactionsPage;