import * as Localization from "expo-localization";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import tw from "./locales/tw.json";
import fr from "./locales/fr.json";
import ga from "./locales/ga.json";
import ee from "./locales/ee.json";
import ha from "./locales/ha.json";

export const SUPPORTED_LANGUAGES = ["en", "tw", "fr", "ga", "ee", "ha"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = "@okadago/language";

/** Native / display labels used by the language dropdown */
export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  tw: "Twi (Akan)",
  fr: "Français",
  ga: "Ga",
  ee: "Eʋegbe (Ewe)",
  ha: "Hausa",
};

function detectDeviceLanguage(): SupportedLanguage {
  const deviceTag = (Localization.getLocales()[0]?.languageCode ?? "en").toLowerCase();
  if (SUPPORTED_LANGUAGES.includes(deviceTag as SupportedLanguage)) {
    return deviceTag as SupportedLanguage;
  }
  // Some devices report Akan as "ak"
  if (deviceTag === "ak") return "tw";
  return "en";
}

// Initialized synchronously at import time (mirrors expo-router's eager module evaluation) so
// every screen has working translations on first render. The persisted user override (if any)
// is applied afterwards by LanguageProvider once AsyncStorage resolves.
void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tw: { translation: tw },
    fr: { translation: fr },
    ga: { translation: ga },
    ee: { translation: ee },
    ha: { translation: ha },
  },
  lng: detectDeviceLanguage(),
  fallbackLng: "en",
  compatibilityJSON: "v4",
  interpolation: { escapeValue: false },
});

export { i18next };
