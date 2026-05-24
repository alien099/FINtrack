import React, { useEffect, useState } from "react";
import { useNavigate, NavLink, Outlet } from "react-router-dom";
import { logout } from "../utils/auth";
import api from "../api";
import "../styles/Layout.css";

function Layout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState("user");

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("auth/me/");
        setUsername(res.data.username);
      } catch (e) {
        console.log("user fetch error");
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="layout">

      {/* ===== BURGER BUTTON (mobile only) ===== */}
      <button
        className={`burger-btn ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Меню"
      >
        <span />
        <span />
        <span />
      </button>

      {/* ===== OVERLAY (mobile only) ===== */}
      {menuOpen && (
        <div className="overlay" onClick={closeMenu} />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>

        {/* TOP */}
        <div className="sidebar-top">
          <h2 className="logo">
            <span className="accent">FIN</span>track
          </h2>

          <nav>
            <NavLink to="/app/dashboard"> Главная </NavLink>
            <NavLink to="/app/analytics"> Аналитика </NavLink>
            <NavLink to="/app/transactions"> Операции</NavLink>
            <div className="nav-divider" />
            <NavLink to="/app/accounts">Счета</NavLink> 
            <NavLink to="/app/categories">Категории</NavLink>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user-info">
            {username}
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Выйти
          </button>
        </div>

      </aside>

      {/* ===== CONTENT ===== */}
      <main className="content">
        <Outlet />
      </main>

    </div>
  );
}

export default Layout;