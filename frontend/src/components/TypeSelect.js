import React, { useEffect, useRef, useState } from "react";
import "./TypeSelect.css";

function TypeSelect({ value, onChange, onlyTypes = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const options = onlyTypes
    ? [
        { id: "income", label: "Доход" },
        { id: "expense", label: "Расход" }
      ]
    : [
        { id: "", label: "Все типы" },
        { id: "income", label: "Доход" },
        { id: "expense", label: "Расход" }
      ];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected =
  options.find(o => o.id === value)?.label ||
  (onlyTypes ? "Выберите тип" : "Тип");

  return (
    <div className="ts" ref={ref}>

      <div className="ts-control" onClick={() => setOpen(!open)}>
        {selected}
      </div>

      {open && (
        <div className="ts-dropdown">

          {options.map(o => (
            <div
              key={o.id}
              className={`ts-item ${value === o.id ? "active" : ""}`}
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
            >
              {o.label}
            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default TypeSelect;