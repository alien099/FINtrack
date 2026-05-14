import axios from "axios";

export const refreshToken = async () => {
  const refresh = localStorage.getItem("refresh");

  if (!refresh) return null;

  try {
    const res = await axios.post(
      "http://127.0.0.1:8000/api/token/refresh/",
      { refresh }
    );

    return res.data.access;

  } catch (e) {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    return null;
  }
};