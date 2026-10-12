import { createContext, useContext, useEffect, useState } from "react";
import { languages, translations, type LangCode, type Language, type Translations } from "@/i18n";

interface LanguageContextValue {
  lang: LangCode;
  t: Translations;
  currentLang: Language;
  setLang: (code: LangCode) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLang(): LangCode {
  try {
    const saved = localStorage.getItem("uyjoy_lang");
    if (saved && saved in translations) return saved as LangCode;
  } catch {}
  return "uz";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(getInitialLang);

  const setLang = (code: LangCode) => {
    setLangState(code);
    try { localStorage.setItem("uyjoy_lang", code); } catch {}
  };

  const currentLang = languages.find((l) => l.code === lang)!;
  const t = translations[lang];

  // Apply RTL / LTR to document
  useEffect(() => {
    document.documentElement.dir = currentLang.dir;
    document.documentElement.lang = lang;
  }, [lang, currentLang.dir]);

  return (
    <LanguageContext.Provider value={{ lang, t, currentLang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
