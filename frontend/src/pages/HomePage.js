import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/HomePage.css";

function HomePage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("main");

  const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (!el) return;

  const yOffset = -80; 
  const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;

  window.scrollTo({ top: y, behavior: "smooth" });
  };
    
  useEffect(() => {
    const sections = document.querySelectorAll("section[id], footer[id]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.9,
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="finance-project main">

      {/* ===== HEADER ===== */}
      <header className="featureIntroSection">
        <div className="container contentContainer">

          <Link to="/" className="topContent">
          { /*<img className="brandLogo" src="/img/logo.png" alt="" />*/}
            <div className="brandNameContainer">
              <span className="brandNameContainer_span0">FIN</span>
              <span className="brandNameContainer_span1">track</span>
            </div>
          </Link >

          <nav className="wrapper">
            <span
              className={activeSection === "main" ? "active" : ""}
              onClick={() => scrollTo("main")}
            >
              Главная
            </span>

            <span
              className={activeSection === "features" ? "active" : ""}
              onClick={() => scrollTo("features")}
            >
              Возможности
            </span>

            <span
              className={activeSection === "about" ? "active" : ""}
              onClick={() => scrollTo("about")}
            >
              О сервисе
            </span>

            <span
              className={activeSection === "footer" ? "active" : ""}
              onClick={() => scrollTo("footer")}
            >
              Контакты
            </span>
          </nav>

          <div className="userActionContainer">
            <Link to="/register">Регистрация</Link>
            <button className="loginLink" onClick={() => navigate("/login")}>
              Вход
            </button>
          </div>

        </div>
      </header>

      {/* ===== HERO ===== */}
      <section id="main" className="financialControlSection">
        <div className="container contentInnerWrapper">

          <div className="textContentWrapper">
            <h1 className="introText">
              Контролируйте свои финансы просто
            </h1>

            <p className="descriptionBox">
              <b>FINtrack</b> — веб-приложение для учета доходов и расходов,
              анализа финансов и планирования бюджета.
            </p>

            <button className="tryButton" onClick={() => navigate("/login")}>
              Попробовать
            </button>
          </div>

          <img className="fintrackImage" src="/img/hero.png" alt="" />

        </div>

        <div className="container">
          <div className="statisticsBlock">
            <div className="statisticsContent">
              
              <div className="statsItemWrapper">
                <img className="statsIcon" src="/img/user.png" alt="" />
                
                <div className="statsText">
                  <div className="usersStat">90 +</div>
                  <div className="statsDescription">Пользователей</div>
                </div>
              </div> 

              <div className="statsItemWrapper">
                <img className="statsIcon" src="/img/star.png" alt="" />

                <div className="statsText">
                  <div className="usersStat">15 +</div>
                  <div className="statsDescription">Категорий</div>
                </div>
              </div>

              <div className="statsItemWrapper">
                <img className="statsIcon" src="/img/Server.png" alt="" />

                <div className="statsText">
                  <div className="usersStat">24/7</div>
                  <div className="statsDescription">Поддержка</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="appFeaturesSection">
        <div className="featuresLayout">

          <div className="featuresImageWrapper">
            <img className="featureImage" src="/img/features.png" alt="" />
          </div>

          <div className="descriptionContainer">
            <h2 className="appCapabilitiesDescription">
              Возможности нашего приложения
            </h2>

            <p className="featureDescription">
              Вы можете ознакомиться с функциями приложения, которые внедрены в него:
            </p>

            <div className="featuresList">

              <div className="featureItem">
                <img src="/img/check.png" className="checkIcon" />
                <span>Добавляйте доходы и расходы за несколько секунд</span>
              </div>

              <div className="featureItem">
                <img src="/img/check.png" className="checkIcon" />
                <span>Создавайте собственные категории для удобной классификации</span>
              </div>

              <div className="featureItem">
                <img src="/img/check.png" className="checkIcon" />
                <span>Анализируйте данные по дням, месяцам и периодам</span>
              </div>

              <div className="featureItem">
                <img src="/img/check.png" className="checkIcon" />
                <span>Контролируйте текущее состояние бюджета</span>
              </div>

            </div>
          </div>
  
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="about" className="aboutSection">

        <div className="container">

          <div className="aboutHeader">
            <h2 className="aboutTitle">О сервисе</h2>
            <p className="aboutSubtitle">
              Данный сервис разработан для удобного учета личных финансов
            </p>
          </div>

          <div className="aboutContent">

            <div className="aboutImageWrapper">
              <img className="aboutImage" src="/img/chart.png" alt="" />
            </div>


            <div className="aboutText">

              <p>
                <b>FINtrack</b> позволяет фиксировать доходы и расходы,
                анализировать структуру затрат и отслеживать текущее финансовое состояние.<br /><br />
                В отличие от сложных финансовых систем, приложение ориентировано на простоту использования и наглядность данных.
                Пользователь может быстро добавлять операции, создавать собственные категории и получать актуальную информацию о состоянии бюджета. <br /><br />
                Сервис подходит как для ежедневного учета расходов, так и для более осознанного управления финансами.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ===== DEMO ===== */}
      <section className="demoSection">
        <div className="container">
          <div className=" demoWrapper">

            <div className="demoContent">
              <h2>Попробовать демо бесплатно</h2>
              <p>Проект разработан в рамках учебной работы</p>
            </div>

            <button className="tryButton" onClick={() => navigate("/login")}>
              Попробовать
            </button>
            
            </div>
          </div>
      </section>

      {/* ===== FOOTER ===== */}
      <section id="footer" className="footer">

        <div className="container footerContent">

          <div className="footerLeft">

            <div className="footerLogo">
              <span className="logoFin">FIN</span>
              <span className="logoTrack">track</span>
            </div>

            <p className="footerDescription">
              <b>FINtrack</b> — это веб-приложение для учета доходов и расходов,
              анализа финансов и планирования бюджета.
            </p>

            <div className="footerIcons">

              <a href="https://t.me/litareae" target="_blank" rel="noopener noreferrer">
                <img src="/img/tg.png" alt="Telegram" />
              </a>

              <a href="https://vk.com/litareae" target="_blank" rel="noopener noreferrer">
                <img src="/img/vk.png" alt="VK" />
              </a>

              <a href="https://wa.me/79006201051" target="_blank" rel="noopener noreferrer">
                <img src="/img/wa.png" alt="WhatsApp" />
              </a>

            </div>

            <div className="footerCopyright">
              ©2026<b>FIN</b>track
            </div>

          </div>

          <div className="footerRight">

            <div className="footerColumn">
              <p className="footerTitle">Приложение</p>
              <span onClick={() => scrollTo("features")}>Возможности</span>
              <span onClick={() => scrollTo("about")}>О сервисе</span>
              <span onClick={() => navigate("/login")}>Попробовать</span>
            </div>

            <div className="footerColumn">
              <p className="footerTitle">Контакты</p>
              <a href="mailto: blotser.al@gmail.com"> email: blotser.al@gmail.com </a>
              <a href="tel: +79006201051">+7 900 620 10 51</a>
              <span>Алина Белоцерковец</span>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default HomePage;