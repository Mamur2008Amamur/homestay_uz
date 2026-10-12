import uz from "./uz";
import en from "./en";
import ru from "./ru";
import zh from "./zh";
import ar from "./ar";
import tr from "./tr";
import type { Translations } from "./uz";

export type LangCode = "uz" | "en" | "ru" | "zh" | "ar" | "tr";

export interface Language {
  code: LangCode;
  name: string;
  flag: string;
  dir: "ltr" | "rtl";
}

export const languages: Language[] = [
  { code: "uz", name: "O'zbekcha", flag: "🇺🇿", dir: "ltr" },
  { code: "ru", name: "Русский",   flag: "🇷🇺", dir: "ltr" },
  { code: "en", name: "English",   flag: "🇬🇧", dir: "ltr" },
  { code: "zh", name: "中文",      flag: "🇨🇳", dir: "ltr" },
  { code: "ar", name: "العربية",   flag: "🇸🇦", dir: "rtl" },
  { code: "tr", name: "Türkçe",    flag: "🇹🇷", dir: "ltr" },
];

export const translations: Record<LangCode, Translations> = { uz, en, ru, zh, ar, tr };

export type { Translations };
