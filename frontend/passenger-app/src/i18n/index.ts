import * as Localization from "expo-localization";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import tw from "./locales/tw.json";

export const SUPPORTED_LANGUAGES = ["en", "tw"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = "@okadago/language";

function detectDeviceLanguage(): SupportedLanguage {
  const deviceTag = Localization.getLocales()[0]?.languageCode ?? "en";
  return SUPPORTED_LANGUAGES.includes(deviceTag as SupportedLanguage) ? (deviceTag as SupportedLanguage) : "en";
}

// Initialized synchronously at import time (mirrors expo-router's eager module evaluation) so
// every screen has working translations on first render. The persisted user override (if any)
// is applied afterwards by LanguageProvider once AsyncStorage resolves.
void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tw: { translation: tw },
  },
  lng: detectDeviceLanguage(),
  fallbackLng: "en",
  compatibilityJSON: "v4",
  interpolation: { escapeValue: false },
});

export { i18next };
