import React, { useEffect, useState, useMemo, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import DateRangeFilter from "../components/DateRangeFilter";
import api from "../api";
import "./Analytics.css";

const EXPENSE_COLORS = [
  "#E93059",
  "#ff6b81",
  "#ff8787",
  "#faa2c1",
  "#f06595",
  "#c2255c",
  "#e64980",
];

const INCOME_COLORS = [
  "#0A315C",
  "#1864ab",
  "#1971c2",
  "#228be6",
  "#339af0",
  "#4dabf7",
  "#74c0fc",
];

function AnalyticsPage() {


  const [analytics, setAnalytics] = useState({
    monthly: [],
    expense_structure: [],
    income_structure: [],
  });

  const [filters, setFilters] = useState({
    date_from: "",
    date_to: "",
  });

  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState("line");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);

    try {
      const params = {};

      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const res = await api.get("analytics/", { params });

      const data = res.data || {};

      setAnalytics({
        monthly: Array.isArray(data.monthly) ? data.monthly : [],
        expense_structure: Array.isArray(data.expense_structure) ? data.expense_structure : [],
        income_structure: Array.isArray(data.income_structure) ? data.income_structure : [],
      });

    } catch (e) {
      console.error("Analytics error:", e);

      setAnalytics({
        monthly: [],
        expense_structure: [],
        income_structure: [],
      });

    } finally {
      setLoading(false);
    }
  }, [filters.date_from, filters.date_to]);

    useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);
  
  const formatCurrency = (num, decimals = 2) => {
    if (num === null || num === undefined || num === "") return "0";

    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(Number(num));
  };

  const totalIncome = useMemo(() => {
    return analytics.monthly.reduce(
      (sum, item) => sum + Number(item.income || 0),
      0
    );
  }, [analytics.monthly]);

  const totalExpense = useMemo(() => {
    return analytics.monthly.reduce(
      (sum, item) => sum + Number(item.expense || 0),
      0
    );
  }, [analytics.monthly]);

  const balance = totalIncome - totalExpense;

  /*
  =========================
  PIE DATA
  =========================
  */

  const expensePie = useMemo(() => {
    return analytics.expense_structure
      .map((item) => ({
        name:
          item.name ||
          item.category__name ||
          "Без категории",

        value: Number(item.total || 0),
      }))
      .filter((item) => item.value > 0);
  }, [analytics.expense_structure]);

  const incomePie = useMemo(() => {
    return analytics.income_structure
      .map((item) => ({
        name:
          item.name ||
          item.category__name ||
          "Без категории",

        value: Number(item.total || 0),
      }))
      .filter((item) => item.value > 0);
  }, [analytics.income_structure]);

  /*
  =========================
  LINE CHART
  =========================
  */

  const lineOption = useMemo(() => ({

    tooltip: {
      trigger: "axis",
    },

    legend: {
      top: 0,

      textStyle: {
        color: "#6b7280",
      },
    },

    grid: {
      left: 20,
      right: 40,
      top: 60,
      bottom: 30,
      containLabel: true,
    },

    xAxis: {
      type: "category",

      boundaryGap: false,

      data: analytics.monthly.map(
        (item) => item.month
      ),

      axisLine: {
        lineStyle: {
          color: "#d0d7e2",
        },
      },

      axisLabel: {
        color: "#6b7280",
        margin: 14,
      },
    },

    yAxis: {
      type: "value",

      splitLine: {
        lineStyle: {
          color: "#eef2f7",
        },
      },

      axisLabel: {
        color: "#6b7280",
      },
    },

    series: [
      {
        name: "Доходы",

        type: "line",

        smooth: true,

        symbol: "circle",

        symbolSize: 8,

        lineStyle: {
          width: 4,
        },

        areaStyle: {
          opacity: 0.08,
        },

        color: "#0A315C",

        data: analytics.monthly.map((item) =>
          Number(item.income || 0)
        ),
      },

      {
        name: "Расходы",

        type: "line",

        smooth: true,

        symbol: "circle",

        symbolSize: 8,

        lineStyle: {
          width: 4,
        },

        areaStyle: {
          opacity: 0.08,
        },

        color: "#E93059",

        data: analytics.monthly.map((item) =>
          Number(item.expense || 0)
        ),
      },
    ],
  }), [analytics.monthly]);

  /* pie options  */

  const createPieOption = (data, colors) => ({
  tooltip: {
    trigger: "item",
    formatter: (params) => `
      ${params.name}<br/>
      ${formatCurrency(params.value)} ₽
      (${params.percent.toFixed(1)}%)
    `,
  },
  legend: { show: false },
  series: [
    {
      type: "pie",
      radius: ["42%", "70%"],
      center: ["50%", "50%"],
      itemStyle: { borderRadius: 10, borderColor: "#fff", borderWidth: 3 },
      label: {
        show: true,
        position: "inside",
        formatter: ({ percent }) => `${percent.toFixed(1)}%`,
        fontSize: 12, fontWeight: 700, color: "#fff",
      },
      emphasis: { scale: true, scaleSize: 6 },
      data: data.map((item, index) => ({
        ...item,
        itemStyle: { color: colors[index % colors.length] },
      })),
    },
  ],
});

  const hasLineData = analytics.monthly.some(
    (item) =>
      Number(item.income || 0) > 0 ||
      Number(item.expense || 0) > 0
  );

  const hasPieData =
    expensePie.length > 0 ||
    incomePie.length > 0;

  return (
    <div className="page">

      <div className="kpi-grid">

        <div className="kpi-card">

          <span className="kpi-label">
            Баланс
          </span>

          <h2>
            {formatCurrency(balance, 0)} ₽
          </h2>

        </div>

        <div className="kpi-card">

          <span className="kpi-label">
            Доходы
          </span>

          <h2 className="income-text">
            {formatCurrency(totalIncome, 0)} ₽
          </h2>

        </div>

        <div className="kpi-card">

          <span className="kpi-label">
            Расходы
          </span>

          <h2 className="expense-text">
            {formatCurrency(totalExpense, 0)} ₽
          </h2>

        </div>

        <div className="kpi-card">

          <span className="kpi-label">
            Категорий
          </span>

          <h2>
            {expensePie.length + incomePie.length}
          </h2>

        </div>

      </div>

      <div className="card-bar">

        <div className="left-bar">

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

          <button
            className="reset"
            onClick={() =>
              setFilters({
                date_from: "",
                date_to: ""
              })
            }
          >
            Сброс
          </button>

        </div>

        <div className="right-bar">
          <p> Выберите тип графика -&gt;</p>
          <button
            className={
              viewMode === "line"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewMode("line")
            }
          >
            Динамика
          </button>

          <button
            className={
              viewMode === "structure"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewMode("structure")
            }
          >
            Структура
          </button>

        </div>

      </div>

      {loading ? (

        <div className="chart-card">
          <div className="empty-state">
            Загрузка...
          </div>
        </div>

      ) : viewMode === "structure" ? (

        expensePie.length || incomePie.length ? (

          <div className="charts-grid">

            <div className="chart-card">

              <div className="card-header">
                <h3>Структура доходов</h3>
              </div>

              <div className="pie-layout">

                <div className="pie-chart">
                  <ReactECharts
                    option={createPieOption(
                      incomePie,
                      INCOME_COLORS
                    )}
                    notMerge
                    lazyUpdate
                  />
                </div>

                <div className="pie-legend">

                  {incomePie.length ? (
                    incomePie.map((item, index) => (
                      <div
                        key={item.name}
                        className="legend-item"
                      >
                        <span
                          className="legend-color"
                          style={{
                            background:
                              INCOME_COLORS[
                                index % INCOME_COLORS.length
                              ],
                          }}
                        />

                        <span className="legend-name">
                          {item.name}
                        </span>

                      </div>
                    ))
                  ) : (
                    <div className="empty-mini">
                      Нет данных
                    </div>
                  )}

                </div>

              </div>

            </div>

            <div className="chart-card">

              <div className="card-header">
                <h3>Структура расходов</h3>
              </div>

              <div className="pie-layout">

                <div className="pie-chart">
                  <ReactECharts
                    option={createPieOption(
                      expensePie,
                      EXPENSE_COLORS
                    )}
                    notMerge
                    lazyUpdate
                  />
                </div>

                <div className="pie-legend">

                  {expensePie.length ? (
                    expensePie.map((item, index) => (
                      <div
                        key={item.name}
                        className="legend-item"
                      >
                        <span
                          className="legend-color"
                          style={{
                            background:
                              EXPENSE_COLORS[
                                index % EXPENSE_COLORS.length
                              ],
                          }}
                        />

                        <span className="legend-name">
                          {item.name}
                        </span>

                      </div>
                    ))
                  ) : (
                    <div className="empty-mini">
                      Нет данных
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>

        ) : (

          <div className="chart-card">

            <div className="empty-state">s

              <p>
                Добавьте доходы или расходы,
                чтобы увидеть структуру категорий
              </p>

            </div>

          </div>

        )

      ) : (

        analytics.monthly.length ? (

          <div className="chart-card">

            <div className="card-header">
              <h3>
                Динамика доходов и расходов
              </h3>
            </div>

            <div className="chart-inner">

              <ReactECharts
                option={lineOption}
                notMerge
                lazyUpdate
              />

            </div>

          </div>

        ) : (

          <div className="chart-card">

            <div className="empty-state">

              <p>
                Добавьте операции,
                чтобы посмотреть динамику
              </p>

            </div>

          </div>

        )

      )}

    </div>
  );
}

export default AnalyticsPage;