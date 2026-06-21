import axios from "axios";
import { refreshToken } from "./api/refresh";

const api = axios.create({
  baseURL: "/api",
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обрабатываем 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Нет ответа или это не 401 — пробрасываем дальше
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // Не ретраить auth-роуты
    if (originalRequest.url.includes("auth/login/") || originalRequest.url.includes("auth/register/")) {
      return Promise.reject(error);
    }

    // Уже ретраили — выходим
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Если рефреш уже идёт — ставим в очередь
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshToken();

      if (!newToken) {
        throw new Error("No token");
      }

      localStorage.setItem("access", newToken);
      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);

    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);

export default api;