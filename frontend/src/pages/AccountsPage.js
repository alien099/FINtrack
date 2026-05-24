import React, { useEffect, useState } from "react";
import api from "../api";
import "../styles/Accounts.css";

const ACCOUNT_TYPES = {
  cash: 'Наличные',
  card: 'Банковская карта',
  deposit: 'Вклад/Счет',
  credit: 'Кредитная карта',
  other: 'Другое',
};

function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'cash' });
  const [toast, setToast] = useState('');
  
  // Подтверждение удаления
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get("accounts/");
      setAccounts(res.data.results || res.data || []);
    } catch (e) {
      setAccounts([]);
    }
  };

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(''), 3000);
  };

  const activeAccounts = accounts.filter(a => a.is_active);
  const isLastActive = activeAccounts.length <= 1;

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("Введите название");
      return;
    }

    try {
      if (editing) {
        await api.patch(`accounts/${editing}/`, form);
        showToast("Счет обновлен");
      } else {
        await api.post("accounts/", form);
        showToast("Счет создан");
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', type: 'cash' });
      fetchAccounts();
    } catch (e) {
      const errorMsg = e.response?.data?.error || "Ошибка сохранения";
      showToast(errorMsg);
    }
  };

  // Запрос подтверждения удаления
  const requestDelete = (account) => {
    if (isLastActive && account.is_active) {
      showToast("Нельзя удалить единственный счет");
      return;
    }
    setAccountToDelete(account);
    setConfirmOpen(true);
  };

  // Подтверждение удаления
  const confirmDelete = async () => {
    if (!accountToDelete) return;

    try {
      await api.delete(`accounts/${accountToDelete.id}/`);
      fetchAccounts();
      showToast("Счет удален");
    } catch (e) {
      const errorMsg = e.response?.data?.error || "Ошибка удаления";
      showToast(errorMsg);
    } finally {
      setConfirmOpen(false);
      setAccountToDelete(null);
    }
  };

  // Отмена удаления
  const cancelDelete = () => {
    setConfirmOpen(false);
    setAccountToDelete(null);
  };

  return (
    <div className="page">
      <h1>Мои счета</h1>

      <div className="accounts-list">
        {accounts.length === 0 ? (
          <div className="empty-state">
            <p>Нет созданных счетов</p>
            <p>Добавьте первый счет, чтобы начать учет</p>
          </div>
        ) : (
          accounts.map(a => (
            <div key={a.id} className={`account-row ${!a.is_active ? 'inactive' : ''}`}>
              <div className="account-row-info">
                <span className="account-row-name">
                  {a.name}
                  {!a.is_active && <span className="inactive-badge"> (архив)</span>}
                </span>
                <span className="account-row-type">{ACCOUNT_TYPES[a.type]}</span>
              </div>
              <span className="account-row-balance">
                {new Intl.NumberFormat('ru-RU').format(a.balance)} ₽
              </span>
              <div className="account-row-actions">
                <button 
                  className="edit-btn"
                  onClick={() => { 
                    setEditing(a.id); 
                    setForm({ name: a.name, type: a.type }); 
                    setShowForm(true); 
                  }}
                  title="Редактировать"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    <path d="m15 5 4 4"/>
                  </svg>
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => requestDelete(a)} 
                  disabled={isLastActive && a.is_active}
                  title={isLastActive && a.is_active ? "Нельзя удалить единственный счет" : "Удалить"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button 
        className="add-account-btn" 
        onClick={() => { 
          setEditing(null); 
          setForm({ name: '', type: 'cash' }); 
          setShowForm(true); 
        }}
      >
        + Добавить счет
      </button>

      {/* Модалка создания/редактирования */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Редактировать счет' : 'Новый счет'}</h3>
            
            <div className="form-group">
              <label>Название</label>
              <input 
                placeholder="Например: Карта Сбер" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Тип счета</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                {Object.entries(ACCOUNT_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="cancel" onClick={() => setShowForm(false)}>Отмена</button>
              <button className="save" onClick={handleSave}>
                {editing ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка подтверждения удаления */}
      {confirmOpen && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Удалить счет?</h3>
            
            <p>
              Вы точно хотите удалить счет{" "}
              <b>{accountToDelete?.name}</b>?
            </p>
            
            {accountToDelete?.balance > 0 && (
              <p className="warning-text">
                Баланс счета: {new Intl.NumberFormat('ru-RU').format(accountToDelete.balance)} ₽.
                Транзакции будут перенесены на другой активный счет.
              </p>
            )}

            <div className="modal-actions">
              <button className="cancel" onClick={cancelDelete}>Отмена</button>
              <button className="delete-confirm" onClick={confirmDelete}>Удалить</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default AccountsPage;