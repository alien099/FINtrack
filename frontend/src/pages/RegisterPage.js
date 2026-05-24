import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import "../styles/Auth.css";

function RegisterPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const isDisabled =
    !form.username ||
    !form.password ||
    !form.confirmPassword;

 const handleRegister = async () => {
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (form.username.length > 20) {
      setError("Слишком длинный логин");
      return;
    }

    try {
      await api.post("auth/register/", {
        username: form.username,
        email: form.email,
        password: form.password,
        password2: form.confirmPassword
      });

      navigate("/login", {
        state: {
          success: "Регистрация прошла успешно"
        }
      });

    } catch (err) {
      const msg = err.response?.data;

      let text = "Ошибка регистрации";

      const raw =
        msg?.detail ||
        (msg && typeof msg === "object"
          ? Object.values(msg)[0]?.[0] || Object.values(msg)[0]
          : null);

      if (raw === "A user with that username already exists.") {
        text = "Такой логин уже занят";
      } else if (raw === "This password is too common.") {
        text = "Слишком простой пароль";
      } else if (
        raw ===
        "This password is too short. It must contain at least 8 characters."
      ) {
        text = "Пароль слишком короткий";
      } else if (raw === "The two password fields didn’t match.") {
        text = "Пароли не совпадают";
      } else if (raw === "This field is required.") {
        text = "Не все поля заполнены";
      } else if (raw === "Enter a valid email address.") {
        text = "Введите корректный email";
      } else if (raw) {
        text = raw;
      }

      setError(text);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <h2>Создать аккаунт</h2>

        <p className={`auth-subtitle ${error ? "error-text" : ""}`}>
          {error || "Заполните данные для регистрации"}
        </p>

        <form className="auth-form">

          <label>Логин</label>
          <input
            maxLength={20}
            className={error ? "input-error" : ""}
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
          />

          <label>Email</label>
          <input
            className={error ? "input-error" : ""}
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <label>Пароль</label>
          <div className="passwordField">
            <input
              type={showPassword ? "text" : "password"}
              className={error ? "input-error" : ""}
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />

            <span
              className="eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              👁
            </span>
          </div>

          <label>Повторите пароль</label>
          <div className="passwordField">
            <input
              type={showPassword ? "text" : "password"}
              className={error ? "input-error" : ""}
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
            />

            <span
              className="eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              👁
            </span>
          </div>

          <button
            onClick={handleRegister}
            disabled={isDisabled}
          >
            Зарегистрироваться
          </button>

        </form>

        <p className="auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>

      </div>

    </div>
  );
}

export default RegisterPage;