import React, { useEffect, useState, useMemo } from "react";
import TypeSelect from "../components/TypeSelect";
import api from "../api";
import "../styles/Categories.css";

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get("categories/");
      setCategories(response.data.results || response.data || []);
    } catch (err) {
      console.error(err);
      setCategories([]);
    }
  };

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(""), 3000);
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      showToast("Введите название категории");
      return;
    }
    if (!type) {
      showToast("Выберите тип категории");
      return;
    }
    try {
      await api.post("categories/", { name, type });
      setName("");
      setType("");
      showToast("Категория добавлена");
      fetchCategories();
    } catch (err) {
      showToast("Такая категория уже существует");
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await api.delete(`categories/${categoryToDelete.id}/`);
      showToast("Категория удалена");
      fetchCategories();
    } catch (err) {
      showToast("Ошибка удаления категории");
    } finally {
      setConfirmOpen(false);
      setCategoryToDelete(null);
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setCategoryToDelete(null);
  };

  const startEdit = (category) => {
    if (category.is_default) return;
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const saveEdit = async (id) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await api.patch(`categories/${id}/`, { name: editingName });
      setEditingId(null);
      setEditingName("");
      showToast("Категория обновлена");
      fetchCategories();
    } catch (err) {
      showToast("Категория уже существует");
    }
  };

  const filteredCategories = useMemo(() => {
    return [...categories]
      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => {
        if (!type) return true;
        return c.type === type;
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "income" ? -1 : 1;
        return a.name.localeCompare(b.name, "ru");
      });
  }, [categories, search, type]);

  return (
    <div className="page">

      <div className="page-header">
        <h1>Категории</h1>
      </div>

      <div className="card-bar">
        <div className="left-bar">
          <input
            placeholder="Название категории"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TypeSelect value={type} onChange={setType} onlyTypes />
          <button onClick={handleAdd}>Добавить</button>
        </div>
        <div className="right-bar">
          <input
            className="search"
            placeholder="Поиск категории..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="categories-table">
        <table className="categories-table-wrapper">
          <thead>
            <tr>
              <th>Название</th>
              <th>Тип</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="3" className="empty">Ничего не найдено</td>
              </tr>
            ) : (
              filteredCategories.map((c) => (
                <tr key={c.id}>
                  <td
                    onClick={() => startEdit(c)}
                    className={`editable ${c.is_default ? "default-category" : "custom-category"}`}
                  >
                    {editingId === c.id ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => saveEdit(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(c.id);
                        }}
                      />
                    ) : (
                      c.name
                    )}
                  </td>
                  <td className="type-cell">
                    <span className={c.type === "income" ? "income-type" : "expense-type"}>
                      {c.type === "income" ? "Доход" : "Расход"}
                    </span>
                  </td>
                  <td className="actions">
                    {!c.is_default && (
                      <button
                        className="delete"
                        onClick={() => {
                          setCategoryToDelete(c);
                          setConfirmOpen(true);
                        }}
                      >
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {confirmOpen && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Удалить категорию?</h3>
            <p>
              Вы точно хотите удалить категорию{" "}
              <b>{categoryToDelete?.name}</b>?
              <br />
              Все операции будут перенесены в "Прочие".
            </p>
            <div className="modal-actions">
              <button className="cancel" onClick={cancelDelete}>Отмена</button>
              <button className="danger" onClick={confirmDelete}>Удалить</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default CategoriesPage;