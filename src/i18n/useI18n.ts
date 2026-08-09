import { useEffect } from "react";
import i18n from "@/i18n";

/** Reflects the active UI language direction onto <html>. */
export function useI18nDirection() {
  useEffect(() => {
    const lang = (i18n.resolvedLanguage ?? "en") as "en" | "he" | "ar" | "ru";
    const dir = lang === "he" || lang === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.classList.toggle("rtl-ui", dir === "rtl");
  }, [i18n.resolvedLanguage]);

  return null;
}