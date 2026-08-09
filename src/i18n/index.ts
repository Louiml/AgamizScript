import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { ProjectLanguage } from "@/types/script";
import en from "./locales/en";
import he from "./locales/he";
import ar from "./locales/ar";
import ru from "./locales/ru";

export const LOCALES = {
  en: { translation: en, dir: "ltr" as const },
  he: { translation: he, dir: "rtl" as const },
  ar: { translation: ar, dir: "rtl" as const },
  ru: { translation: ru, dir: "ltr" as const },
};

export type Language = ProjectLanguage;

const stored = (localStorage.getItem("agamiz-language") as Language) || "en";
const initial: Language = stored in LOCALES ? stored : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    he: { translation: he },
    ar: { translation: ar },
    ru: { translation: ru },
  },
  lng: initial,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export function setLanguage(lang: Language) {
  i18n.changeLanguage(lang);
  localStorage.setItem("agamiz-language", lang);
  applyDirection(lang);
}

export function applyDirection(lang: Language) {
  const dir = LOCALES[lang].dir;
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.setAttribute("lang", lang);
}

export function currentDirection(): "ltr" | "rtl" {
  const lang = (i18n.language as Language) ?? "en";
  return LOCALES[lang]?.dir ?? "ltr";
}

// Apply on boot
applyDirection(initial);

export default i18n;