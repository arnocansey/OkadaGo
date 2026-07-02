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
import {
  darkColors,
  getStackHeaderOptions,
  getTypography,
  lightColors,
  type ThemeColors,
} from "@/theme/tokens";

const THEME_STORAGE_KEY = "@okadago/theme-mode";

export type ThemeMode = "dark" | "light";

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  typography: ReturnType<typeof getTypography>;
  stackHeaderOptions: ReturnType<typeof getStackHeaderOptions>;
  setTheme: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark") {
          setMode(saved);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const setTheme = useCallback(async (next: ThemeMode) => {
    setMode(next);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(async () => {
    await setTheme(mode === "dark" ? "light" : "dark");
  }, [mode, setTheme]);

  const colors = mode === "dark" ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === "dark",
      colors,
      typography: getTypography(colors),
      stackHeaderOptions: getStackHeaderOptions(colors),
      setTheme,
      toggleTheme,
      ready,
    }),
    [mode, colors, setTheme, toggleTheme, ready],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
