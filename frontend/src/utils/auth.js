export const logout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};

export const getToken = () =>
  localStorage.getItem("access") ||
  sessionStorage.getItem("access");