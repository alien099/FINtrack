import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import "./Auth.css";

function LoginPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    remember: false
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isDisabled = !form.username || !form.password;

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [error]);

  const handleLogin = async (e) => {
    e?.preventDefault();

    if (isDisabled) return;

    setError("");
    setLoading(true);

    try {
      const res = await api.post("auth/login/", {
        username: form.username,
        password: form.password
      });

      console.log("LOGIN RESPONSE:", res.data);

      const access = res.data.access;
      const refresh = res.data.refresh;

      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      console.log("TOKEN SAVED:", {
        access: localStorage.getItem("access"),
        refresh: localStorage.getItem("refresh")
      });

      navigate("/app/dashboard", { replace: true });

    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data);
      setError("Неверный логин или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <h2>Вход в аккаунт</h2>

        <p className={`auth-subtitle ${error ? "error-text" : ""}`}>
          {error || "Введите логин и пароль для входа"}
        </p>

        <form className="auth-form" onSubmit={handleLogin}>

          <label>Логин</label>
          <input
            type="text"
            value={form.username} 
            onChange={(e) => {
            setError("");
            setForm({ ...form, username: e.target.value });
          }}
 
          />

          <label>Пароль</label>
          <div className="passwordField">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => {
                setError("");
                setForm({ ...form, password: e.target.value })
              }}
            />

            <span
              className="eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              👁
            </span>
          </div>

          <button type="submit" disabled={isDisabled || loading}>
            {loading ? "Вход..." : "Войти"}
          </button>

        </form>

        <p className="auth-footer">
          Еще нет аккаунта? <Link to="/register">Регистрация</Link>
        </p>

      </div>

    </div>
  );
}

export default LoginPage;