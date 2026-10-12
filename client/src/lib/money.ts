/**
 * Formats a number as Uzbek soum according to selected language:
 * - uz: "420 000 so'm"
 * - ru: "420 000 сум"
 * - en: "420 000 UZS"
 */
export function money(n: number, lang?: string): string {
  const currentLang =
    lang ||
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("uyjoy_language") || "uz"
      : "uz");

  const formatted = new Intl.NumberFormat("ru-RU").format(Math.round(n || 0));

  let unit = "so'm";
  if (currentLang === "ru") {
    unit = "сум";
  } else if (currentLang === "en") {
    unit = "UZS";
  }

  return `${formatted} ${unit}`;
}

export function moneyPerNight(n: number, perNightLabel = "/ tun", lang?: string): string {
  return `${money(n, lang)} ${perNightLabel}`;
}
