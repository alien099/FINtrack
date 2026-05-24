import React, { useEffect, useState } from "react";
import api from "../api";
import "../styles/TransferModal.css";

function TransferModal({ onClose, onSuccess, showToast }) {
  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get("accounts/").then(res => {
      setAccounts((res.data.results || res.data || []).filter(a => a.is_active));
    });
  }, []);

  const handleTransfer = async () => {
    if (!fromAccount) { showToast("Выберите счет списания"); return; }
    if (!toAccount) { showToast("Выберите счет зачисления"); return; }
    if (fromAccount === toAccount) { showToast("Счета должны быть разными"); return; }
    if (!amount || Number(amount) <= 0) { showToast("Введите сумму"); return; }

    const fromName = accounts.find(a => a.id === Number(fromAccount))?.name || "другой счет";
    const toName = accounts.find(a => a.id === Number(toAccount))?.name || "другой счет";

    setSending(true);
    try {
      await api.post("transactions/transfer/", {
        from_account: fromAccount,
        to_account: toAccount,
        amount: Number(amount)
      });

      onSuccess();
    } catch (e) {
      const errorMsg = e.response?.data?.error || "Ошибка перевода";
      showToast(errorMsg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal transfer-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Перевод между счетами</h3>

        <div className="form-group">
          <label>Со счета</label>
          <select value={fromAccount} onChange={e => setFromAccount(e.target.value)}>
            <option value="">Выберите счет</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({new Intl.NumberFormat('ru-RU').format(a.balance)} ₽)
              </option>
            ))}
          </select>
        </div>

        <div className="transfer-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <polyline points="19 12 12 19 5 12"/>
          </svg>
        </div>

        <div className="form-group">
          <label>На счет</label>
          <select value={toAccount} onChange={e => setToAccount(e.target.value)}>
            <option value="">Выберите счет</option>
            {accounts.filter(a => String(a.id) !== fromAccount).map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({new Intl.NumberFormat('ru-RU').format(a.balance)} ₽)
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Сумма</label>
          <input
            type="number"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button className="cancel" onClick={onClose}>Отмена</button>
          <button className="save" onClick={handleTransfer} disabled={sending}>
            {sending ? "Перевод..." : "Перевести"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransferModal;