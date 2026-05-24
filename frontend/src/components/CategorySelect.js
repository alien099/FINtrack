import React, { useEffect, useRef, useState } from "react";
import api from "../api";
import "../styles/CategorySelect.css";

function CategorySelect({ value, onChange, type }) {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    api.get("categories/")
      .then(res => setCategories(res.data.results || res.data || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = categories.filter(c => c.type === type);
  const selected = categories.find(c => c.id === value);

  return (
    <div className="cs" ref={ref}>
      <div className="cs-control" onClick={() => setOpen(!open)}>
        {selected ? (
          <span>{selected.name}</span>
        ) : (
          <span className="cs-placeholder">Категория</span>
        )}
      </div>

      {open && (
        <div className="cs-dropdown">
          {filtered.length === 0 ? (
            <div className="cs-empty">Нет категорий</div>
          ) : (
            filtered.map(c => (
              <div
                key={c.id}
                className={`cs-item ${value === c.id ? 'active' : ''}`}
                onClick={() => { onChange(c.id); setOpen(false); }}
              >
                <span>{c.name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default CategorySelect;