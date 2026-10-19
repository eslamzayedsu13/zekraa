export type Lang = "ar" | "en";

const arNumber = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 });
const enNumber = new Intl.NumberFormat("en-EG", { maximumFractionDigits: 0 });

/** Prices are whole Egyptian pounds. Arabic: "١٬٢٥٠ ج.م" — English: "EGP 1,250". */
export function formatPrice(amount: number, lang: Lang): string {
  const n = Math.round(amount);
  return lang === "ar" ? `${arNumber.format(n)} ج.م` : `EGP ${enNumber.format(n)}`;
}

export function formatNumber(n: number, lang: Lang): string {
  return (lang === "ar" ? arNumber : enNumber).format(n);
}

export function formatDate(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
