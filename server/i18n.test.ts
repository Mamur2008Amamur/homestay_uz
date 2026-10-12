import { describe, expect, it } from "vitest";
import { translations, languages, type LangCode } from "../client/src/i18n";
import uz from "../client/src/i18n/uz";

const uzKeys = Object.keys(uz).filter((k) => k !== "inspire_events");

describe("i18n", () => {
  it("har bir til uchun barcha o'zbek kalitlari mavjud", () => {
    for (const { code } of languages) {
      const dict = translations[code as LangCode] as unknown as Record<string, unknown>;
      const missing = uzKeys.filter((k) => !(k in dict));
      expect({ code, missing }).toEqual({ code, missing: [] });
    }
  });

  it("bo'sh qiymat yo'q (inspire_events dan tashqari)", () => {
    for (const { code } of languages) {
      const dict = translations[code as LangCode] as unknown as Record<string, unknown>;
      for (const k of uzKeys) {
        const v = dict[k];
        const empty = v === "" || v === undefined || v === null
          // "0 kish" kabi nol qiymatlar ham bo'sh hisoblanadi
          || (typeof v === "string" && v.trim() === "");
        expect({ code, key: k, empty }).toEqual({ code, key: k, empty: false });
      }
    }
  });

  it("placeholder kalitlari har bir tarjimada bor", () => {
    const withPlaceholder = uzKeys.filter((k) => String(uz[k as keyof typeof uz]).includes("{n}"));
    for (const { code } of languages) {
      const dict = translations[code as LangCode] as unknown as Record<string, string>;
      const broken = withPlaceholder.filter((k) => !String(dict[k]).includes("{n}"));
      expect({ code, broken }).toEqual({ code, broken: [] });
    }
  });

  it("tillar ro'yxati to'g'ri", () => {
    const codes = languages.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const { code } of languages) {
      expect(translations[code as LangCode]).toBeDefined();
    }
  });
});
