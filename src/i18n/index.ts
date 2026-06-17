import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

// 当前面向中国大陆用户，仅启用中文。如需重新开放英文，把 "en" 加回数组并恢复 Settings 中的英文选项。
export const SUPPORTED_LOCALES = ["zh"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_STORAGE_KEY = "app.locale";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    fallbackLng: "zh",
    lng: "zh",
    supportedLngs: SUPPORTED_LOCALES as unknown as string[],
    nonExplicitSupportedLngs: true,
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

// 旧用户本地缓存可能是 "en"，强制改回 zh
try {
  if (typeof window !== "undefined") {
    const cached = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (cached && cached !== "zh") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, "zh");
    }
    if (i18n.language !== "zh") {
      void i18n.changeLanguage("zh");
    }
  }
} catch {
  /* ignore */
}

export default i18n;
