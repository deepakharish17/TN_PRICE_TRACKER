// ── Theme manager ────────────────────────────────────────
// Handles dark/light mode independently from user/admin role theme

export const getColorMode = () => localStorage.getItem("colorMode") || "dark";
export const setColorMode = (mode) => {
  localStorage.setItem("colorMode", mode);
  applyColorMode(mode);
};

export const applyColorMode = (mode) => {
  const m = mode || getColorMode();
  const root = document.documentElement;
  if (m === "light") {
    root.setAttribute("data-color", "light");
  } else {
    root.removeAttribute("data-color");
  }
};

export const toggleColorMode = () => {
  const current = getColorMode();
  const next = current === "dark" ? "light" : "dark";
  setColorMode(next);
  return next;
};
