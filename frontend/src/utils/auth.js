export const getToken    = () => localStorage.getItem("token");
export const getRole     = () => localStorage.getItem("role");
export const getUserName = () => localStorage.getItem("userName");
export const getUserEmail= () => localStorage.getItem("userEmail");

export const isLoggedIn  = () => !!getToken();
export const isAdmin     = () => getRole() === "admin";

export const saveSession = ({ token, role, name, email }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("role",  role);
  if (name)  localStorage.setItem("userName",  name);
  if (email) localStorage.setItem("userEmail", email);
  // Apply theme to document
  document.documentElement.setAttribute("data-theme", role === "admin" ? "admin" : "user");
};

export const applyTheme = () => {
  const role = getRole();
  document.documentElement.setAttribute("data-theme", role === "admin" ? "admin" : "user");
};

export const logout = (navigate) => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  if (navigate) navigate("/");
};
