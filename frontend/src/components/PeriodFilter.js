import React, { useEffect, useRef, useState } from "react";
import "../styles/PeriodFilter.css";

const PERIODS = [
  { value: "all", label: "Все время" },
  { value: "year", label: "Год" },
  { value: "month", label: "Месяц" },
  { value: "week", label: "Неделя" },
  { value: "day", label: "День" },
  { value: "custom", label: "Даты" },
];

function PeriodFilter({ value, onChange, onCustomChange, customFrom, customTo }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = PERIODS.find(p => p.value === value)?.label || "Все время";

  return (
    <div className="pf" ref={ref}>
      <div className="pf-control" onClick={() => setOpen(!open)}>
        {selected}
      </div>

      {open && (
        <div className="pf-dropdown">
          {PERIODS.map(p => (
            <div
              key={p.value}
              className={`pf-item ${value === p.value ? 'active' : ''}`}
              onClick={() => {
                onChange(p.value);
                setOpen(false);
              }}
            >
              {p.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PeriodFilter;