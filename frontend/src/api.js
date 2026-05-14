import axios from "axios";
import { refreshToken } from "./api/refresh";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

let isRefreshing = false;
let refreshPromise = null;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  queue = [];
};

api.interceptors.request.use((config) => {

  const token = localStorage.getItem("access");

  if (token) {

    if (!config.headers) {
      config.headers = {};
    }

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    const isAuthRoute =
      originalRequest.url.includes("auth/login/") ||
      originalRequest.url.includes("auth/register/");

    if (isAuthRoute) {
      return Promise.reject(error);
    }

    if (error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        isRefreshing = true;

        refreshPromise = refreshToken().finally(() => {
          isRefreshing = false;
        });
      }

      const newToken = await refreshPromise;
      refreshPromise = null;

      if (!newToken) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        window.location.href = "/login";

        return Promise.reject(error);
      }

      localStorage.setItem("access", newToken);

      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${newToken}`,
      };

      return api(originalRequest);

    } catch (e) {
      refreshPromise = null;

      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      window.location.href = "/login";

      return Promise.reject(e);
    }
  }
);

export default api;