// src/hooks/useLang.js
import { useState, useEffect, createContext, useContext } from "react";
import { translations } from "../utils/lang";

export const LangContext = createContext();

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");
  const toggleLang = () => {
    const next = lang === "en" ? "ta" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  };
  const t = (key) => translations[lang]?.[key] || translations["en"]?.[key] || key;
  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
