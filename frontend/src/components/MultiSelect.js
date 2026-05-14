import React, { useEffect, useMemo, useRef, useState } from "react";
import "./MultiSelect.css";

function MultiSelect({ options, value, onChange, placeholder = "Выбрать..." }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    return options.filter((o) =>
      o.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const toggle = (id) => {
    const exists = value.includes(id);

    const newValue = exists
      ? value.filter((v) => v !== id)
      : [...value, id];

    onChange(newValue);
  };

  const selectedLabels = options
    .filter((o) => value.includes(o.id))
    .map((o) => o.name);

  return (
    <div className="ms" ref={ref}>

      <div className="ms-control" onClick={() => setOpen(!open)}>
        {selectedLabels.length ? selectedLabels.join(", ") : placeholder}
      </div>

      {open && (
        <div className="ms-dropdown">

          <input
            className="ms-search"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="ms-options">

            {filtered.length === 0 && (
              <div className="ms-empty">Ничего не найдено</div>
            )}

            {filtered.map((o) => (
              <label key={o.id} className="ms-item">

                <input
                  type="checkbox"
                  checked={value.includes(o.id)}
                  onChange={() => toggle(o.id)}
                />

                <span>{o.name}</span>

              </label>
            ))}

          </div>

        </div>
      )}

    </div>
  );
}

export default MultiSelect;