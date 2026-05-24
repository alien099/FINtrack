import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/AccountSelector.css";

function AccountSelector({ value, onChange, showAll = false, placeholder = "Счет" }) {
  const [accounts, setAccounts] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("accounts/")
      .then(res => setAccounts(res.data.results || res.data || []))
      .catch(() => setAccounts([]));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeAccounts = accounts.filter(a => a.is_active);
  const selected = accounts.find(a => a.id === value);

  const getDisplayText = () => {
    if (showAll && value === "") return "Все счета";
    if (selected) return selected.name;
    return placeholder;
  };

  return (
    <div className="as" ref={ref}>
      <div className="as-control" onClick={() => setOpen(!open)}>
        <span className={!selected && value === "" && showAll ? "" : (selected ? "" : "as-placeholder")}>
          {getDisplayText()}
        </span>
      </div>

      {open && (
        <div className="as-dropdown">
          {/* Опция "Все счета" */}
          {showAll && (
            <div
              className={`as-item ${value === "" ? 'active' : ''}`}
              onClick={() => { onChange(""); setOpen(false); }}
            >
              Все счета
            </div>
          )}

          {/* Нет счетов */}
          {activeAccounts.length === 0 ? (
            <div className="as-empty">
              <p>Нет созданных счетов</p>
              <button
                className="as-create-btn"
                onClick={() => { setOpen(false); navigate("/app/accounts"); }}
              >
                + Создать счет
              </button>
            </div>
          ) : (
            activeAccounts.map(a => (
              <div
                key={a.id}
                className={`as-item ${value === a.id ? 'active' : ''}`}
                onClick={() => { onChange(a.id); setOpen(false); }}
              >
                {a.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AccountSelector;