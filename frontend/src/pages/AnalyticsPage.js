import React, { useEffect, useState, useMemo, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import DateRangeFilter from "../components/DateRangeFilter";
import AccountSelector from "../components/AccountSelector";
import PeriodFilter from "../components/PeriodFilter";
import api from "../api";
import "../styles/Analytics.css";

const EXPENSE_COLORS = ["#E93059", "#ff6b81", "#ff8787", "#faa2c1", "#f06595", "#c2255c", "#e64980"];
const INCOME_COLORS = ["#0A315C", "#1864ab", "#1971c2", "#228be6", "#339af0", "#4dabf7", "#74c0fc"];

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({ monthly: [], expense_structure: [], income_structure: [] });
  const [period, setPeriod] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("line");

  const getPeriodDates = useCallback((p) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (p) {
      case "day": return { from: today.toISOString().split("T")[0], to: today.toISOString().split("T")[0] };
      case "week": {
        const mon = new Date(today); mon.setDate(today.getDate() - (today.getDay() || 7) + 1);
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
        return { from: mon.toISOString().split("T")[0], to: sun.toISOString().split("T")[0] };
      }
      case "month": return {
        from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]
      };
      case "year": return {
        from: new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0],
        to: new Date(now.getFullYear(), 11, 31).toISOString().split("T")[0]
      };
      default: return { from: "", to: "" };
    }
  }, []);

  const isSmallPeriod = ["day", "week", "month"].includes(period);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (period === "custom") {
        if (customFrom) params.date_from = customFrom;
        if (customTo) params.date_to = customTo;
      } else {
        const { from, to } = getPeriodDates(period);
        if (from) params.date_from = from;
        if (to) params.date_to = to;
      }
      if (accountFilter) params.account = accountFilter;
      if (isSmallPeriod) params.group_by = "day";

      const res = await api.get("analytics/", { params });
      const data = res.data || {};
      setAnalytics({
        monthly: Array.isArray(data.monthly) ? data.monthly : [],
        expense_structure: Array.isArray(data.expense_structure) ? data.expense_structure : [],
        income_structure: Array.isArray(data.income_structure) ? data.income_structure : [],
      });
    } catch (e) {
      setAnalytics({ monthly: [], expense_structure: [], income_structure: [] });
    } finally {
      setLoading(false);
    }
  }, [period, customFrom, customTo, accountFilter, isSmallPeriod]);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const formatCurrency = (num, decimals = 2) => {
    if (num === null || num === undefined || num === "") return "0";
    return new Intl.NumberFormat("ru-RU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(num));
  };

  const totalIncome = useMemo(() => analytics.monthly.reduce((s, i) => s + Number(i.income || 0), 0), [analytics.monthly]);
  const totalExpense = useMemo(() => analytics.monthly.reduce((s, i) => s + Number(i.expense || 0), 0), [analytics.monthly]);
  const balance = totalIncome - totalExpense;

  const expensePie = useMemo(() => analytics.expense_structure.map(i => ({ name: i.name || "Без категории", value: Number(i.total || 0) })).filter(i => i.value > 0), [analytics.expense_structure]);
  const incomePie = useMemo(() => analytics.income_structure.map(i => ({ name: i.name || "Без категории", value: Number(i.total || 0) })).filter(i => i.value > 0), [analytics.income_structure]);

  const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

  const formatLabel = (val) => {
    if (val.length === 7) {
      const d = new Date(val + "-01");
      if (isNaN(d.getTime())) return val;
      return `${months[d.getMonth()]}.${String(d.getFullYear()).slice(2)}`;
    } else {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
  };

  const xLabels = useMemo(() => analytics.monthly.map(item => formatLabel(item.month)), [analytics.monthly, isSmallPeriod]);

  const lineOption = useMemo(() => ({
    tooltip: { trigger: "axis" },
    legend: { top: 0, textStyle: { color: "#6b7280" } },
    grid: { left: 20, right: 20, top: 50, bottom: 30, containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: xLabels, axisLine: { lineStyle: { color: "#d0d7e2" } }, axisLabel: { color: "#6b7280", margin: 10 } },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#eef2f7" } },
      axisLabel: { color: "#6b7280", show: window.innerWidth >= 600 }
    },
    series: [
      { name: "Доходы", type: "line", smooth: true, symbol: "circle", symbolSize: 6, lineStyle: { width: 3 }, areaStyle: { opacity: 0.08 }, color: "#0A315C", data: analytics.monthly.map(i => Number(i.income || 0)) },
      { name: "Расходы", type: "line", smooth: true, symbol: "circle", symbolSize: 6, lineStyle: { width: 3 }, areaStyle: { opacity: 0.08 }, color: "#E93059", data: analytics.monthly.map(i => Number(i.expense || 0)) },
    ],
  }), [analytics.monthly, xLabels]);

  const createPieOption = (data, colors) => ({
    tooltip: { trigger: "item", formatter: (params) => `${params.name}<br/>${formatCurrency(params.value)} ₽ (${params.percent.toFixed(1)}%)` },
    legend: { show: false },
    series: [{ type: "pie", radius: ["42%", "70%"], center: ["50%", "50%"], itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 3 }, label: { show: true, position: "inside", formatter: ({ percent }) => `${percent.toFixed(1)}%`, fontSize: 12, fontWeight: 700, color: "#fff" }, emphasis: { scale: true, scaleSize: 6 }, data: data.map((item, i) => ({ ...item, itemStyle: { color: colors[i % colors.length] } })) }],
  });

  return (
    <div className="page">
      <div className="kpi-grid">
        <div className="kpi-card"><span className="kpi-label">Баланс</span><h2>{formatCurrency(balance, 0)} ₽</h2></div>
        <div className="kpi-card"><span className="kpi-label">Доходы</span><h2 className="income-text">{formatCurrency(totalIncome, 0)} ₽</h2></div>
        <div className="kpi-card"><span className="kpi-label">Расходы</span><h2 className="expense-text">{formatCurrency(totalExpense, 0)} ₽</h2></div>
        <div className="kpi-card"><span className="kpi-label">Категорий</span><h2>{expensePie.length + incomePie.length}</h2></div>
      </div>

      <div className="card-bar">
        <div className="left-bar">
          <AccountSelector value={accountFilter} onChange={setAccountFilter} showAll />
          <PeriodFilter value={period} onChange={setPeriod} />
          {period === "custom" && (
            <DateRangeFilter from={customFrom} to={customTo} onFromChange={v => setCustomFrom(v)} onToChange={v => setCustomTo(v)} />
          )}
          <button className="reset-icon" onClick={() => { setPeriod("all"); setCustomFrom(""); setCustomTo(""); setAccountFilter(""); }} title="Сбросить">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
        <div className="right-bar">
          <p>График →</p>
          <button className={viewMode === "line" ? "active" : ""} onClick={() => setViewMode("line")}>Динамика</button>
          <button className={viewMode === "structure" ? "active" : ""} onClick={() => setViewMode("structure")}>Структура</button>
        </div>
      </div>

      {loading ? (
        <div className="chart-card"><div className="empty-state">Загрузка...</div></div>
      ) : viewMode === "structure" ? (
        expensePie.length || incomePie.length ? (
          <div className="charts-grid">
            <div className="chart-card">
              <div className="card-header"><h3>Структура доходов</h3></div>
              <div className="pie-layout">
                <div className="pie-chart"><ReactECharts option={createPieOption(incomePie, INCOME_COLORS)} notMerge lazyUpdate /></div>
                <div className="pie-legend">
                  {incomePie.length ? incomePie.map((item, i) => (
                    <div key={item.name} className="legend-item"><span className="legend-color" style={{ background: INCOME_COLORS[i % INCOME_COLORS.length] }} /><span className="legend-name">{item.name}</span></div>
                  )) : <div className="empty-mini">Нет данных</div>}
                </div>
              </div>
            </div>
            <div className="chart-card">
              <div className="card-header"><h3>Структура расходов</h3></div>
              <div className="pie-layout">
                <div className="pie-chart"><ReactECharts option={createPieOption(expensePie, EXPENSE_COLORS)} notMerge lazyUpdate /></div>
                <div className="pie-legend">
                  {expensePie.length ? expensePie.map((item, i) => (
                    <div key={item.name} className="legend-item"><span className="legend-color" style={{ background: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} /><span className="legend-name">{item.name}</span></div>
                  )) : <div className="empty-mini">Нет данных</div>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="chart-card"><div className="empty-state"><p>Добавьте доходы или расходы, чтобы увидеть структуру категорий</p></div></div>
        )
      ) : (
        analytics.monthly.length ? (
          <div className="chart-card" style={{ flex: 1 }}>
            <div className="card-header"><h3>Динамика доходов и расходов</h3></div>
            <div className="chart-inner"><ReactECharts option={lineOption} notMerge lazyUpdate /></div>
          </div>
        ) : (
          <div className="chart-card"><div className="empty-state"><p>Добавьте операции для просмотра динамики</p></div></div>
        )
      )}
    </div>
  );
}

export default AnalyticsPage;