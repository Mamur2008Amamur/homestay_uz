import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { languages } from "@/i18n";
import { ChevronDown, Home as HomeIcon, Menu, Search, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

type Props = {
  overlay?: boolean;
};

export default function HomestayHeader({ overlay = false }: Props) {
  const { t, currentLang, lang, setLang } = useLanguage();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) setLanguageOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const textColor = overlay ? "text-white" : "text-[#273c3a]";
  const borderColor = overlay ? "border-white/15" : "border-[#e8e4dc]";

  return (
    <header className={`sticky top-0 z-40 border-b bg-white/95 backdrop-blur-xl ${borderColor} ${overlay ? "absolute top-0 bg-transparent backdrop-blur-[2px]" : ""}`}>
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-5 py-3 lg:px-8">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5" aria-label="UyJoy bosh sahifasi">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d52a75] text-white shadow-sm"><HomeIcon size={18} strokeWidth={2.5} /></span>
          <span className={`font-display text-[23px] font-extrabold tracking-[-0.05em] ${textColor}`}>uyjoy<span className="text-[#d52a75]">.</span></span>
        </button>

        <nav className="hidden items-center gap-7 text-[12px] font-bold uppercase tracking-[0.04em] xl:flex">
          <button onClick={() => navigate("/search")} className={`transition hover:text-[#d52a75] ${textColor}`}>{t.nav_directions}</button>
          <button onClick={() => navigate("/inspire")} className={`transition hover:text-[#d52a75] ${textColor}`}>{t.nav_inspire}</button>
          <button onClick={() => navigate("/hosting")} className={`transition hover:text-[#d52a75] ${textColor}`}>{t.nav_hosting}</button>
          <button onClick={() => navigate("/help")} className={`transition hover:text-[#d52a75] ${textColor}`}>{t.nav_help}</button>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div ref={languageRef} className="relative">
            <button onClick={() => setLanguageOpen(value => !value)} className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition hover:bg-black/5 ${textColor}`}>
              <span>{currentLang.flag}</span><ChevronDown size={13} />
            </button>
            {languageOpen && (
              <div className="absolute end-0 top-[calc(100%+8px)] w-40 overflow-hidden rounded-2xl border border-[#ebe7df] bg-white p-1.5 shadow-xl">
                {languages.map(language => (
                  <button key={language.code} onClick={() => { setLang(language.code); setLanguageOpen(false); }} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs ${lang === language.code ? "bg-[#fff0f6] font-bold text-[#d52a75]" : "text-[#69716d] hover:bg-[#f7f5f2]"}`}>
                    <span>{language.flag}</span><span>{language.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {isAuthenticated ? (
            <button onClick={() => logout()} className="flex items-center gap-2 rounded-full border border-[#dedbd6] px-4 py-2 text-xs font-bold text-[#273c3a] transition hover:border-[#d52a75]">
              <UserRound size={15} /><span>{user?.name?.split(" ")[0] || t.nav_logout}</span>
            </button>
          ) : (
            <button onClick={startLogin} className="rounded-full bg-[#273c3a] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#183a37]">{t.nav_login}</button>
          )}
          <button onClick={() => navigate("/search")} className="flex items-center gap-2 rounded-full border border-[#dedbd6] bg-white px-4 py-2 text-xs font-bold text-[#273c3a] shadow-sm transition hover:border-[#d52a75]">
            <Search size={15} /> {t.nav_find_homes}
          </button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {isAuthenticated ? (
            <button onClick={() => logout()} className="rounded-full bg-[#fff0f6] px-3 py-2 text-xs font-bold text-[#d52a75]">{user?.name?.split(" ")[0] || "👋"}</button>
          ) : (
            <button onClick={startLogin} className="rounded-full bg-[#273c3a] px-3 py-2 text-xs font-bold text-white">{t.nav_login}</button>
          )}
          <button onClick={() => setMenuOpen(value => !value)} className={`grid h-10 w-10 place-items-center rounded-full border ${overlay ? "border-white/40 text-white" : "border-[#dedbd6] text-[#273c3a]"}`} aria-label="Menyu">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-[#ebe7df] bg-white px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-1 text-sm font-bold text-[#273c3a]">
            <button onClick={() => { navigate("/search"); setMenuOpen(false); }} className="rounded-xl px-3 py-3 text-left hover:bg-[#f7f5f2]">{t.nav_directions}</button>
            <button onClick={() => { navigate("/inspire"); setMenuOpen(false); }} className="rounded-xl px-3 py-3 text-left hover:bg-[#f7f5f2]">{t.nav_inspire}</button>
            <button onClick={() => { navigate("/hosting"); setMenuOpen(false); }} className="rounded-xl px-3 py-3 text-left hover:bg-[#f7f5f2]">{t.nav_hosting}</button>
            <button onClick={() => { navigate("/help"); setMenuOpen(false); }} className="rounded-xl px-3 py-3 text-left hover:bg-[#f7f5f2]">{t.nav_help}</button>
          </div>
        </div>
      )}
    </header>
  );
}