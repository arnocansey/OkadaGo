import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { i18next, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";

type LanguageContextValue = {
  language: SupportedLanguage;
  setLanguage: (next: SupportedLanguage) => Promise<void>;
  ready: boolean;
  supportedLanguages: readonly SupportedLanguage[];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(
    (i18next.language as SupportedLanguage) ?? "en",
  );
  const [ready, setReady] = useState(false);
  const { i18n } = useTranslation();

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then(async (saved) => {
        if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage) && saved !== i18n.language) {
          await i18n.changeLanguage(saved);
          setLanguageState(saved as SupportedLanguage);
        }
      })
      .finally(() => setReady(true));
  }, [i18n]);

  const setLanguage = useCallback(
    async (next: SupportedLanguage) => {
      await i18n.changeLanguage(next);
      setLanguageState(next);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    },
    [i18n],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, ready, supportedLanguages: SUPPORTED_LANGUAGES }),
    [language, setLanguage, ready],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
