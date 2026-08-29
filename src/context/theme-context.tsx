import { Uniwind, useUniwind } from "uniwind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemePreference = "light" | "dark" | "system";

type ThemeContextType = {
  /** User-chosen preference (or "system" to follow the OS). */
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  /** The actual applied theme after resolving "system". */
  resolvedTheme: "light" | "dark";
  isDark: boolean;
};

const KEY = "zoe.theme.preference";

const ThemeContext = createContext<ThemeContextType | null>(null);

/** Persisted inside AsyncStorage; "system" is the default. */
function normalize(pref: string | null): ThemePreference {
  if (pref === "light" || pref === "dark") return pref;
  return "system";
}

type ProviderProps = { children: ReactNode };

/**
 * Owns the app-wide theme. Persists the user's preference and drives both
 * uniwind's CSS-variable theme (bg-bg, text-primary, …) and the React
 * Navigation theme (status bar / backgrounds).
 */
export function ThemeProvider({ children }: ProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  // The concrete light/dark theme currently driving uniwind's CSS variables.
  const { theme: currentUniwindTheme } = useUniwind();

  const applyUniwindTheme = useCallback((pref: ThemePreference) => {
    try {
      Uniwind.setTheme(pref);
    } catch (e) {
      console.warn("uniwind setTheme failed", e);
    }
  }, []);

  // Restore the persisted preference on first mount.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .then((stored) => {
        if (cancelled) return;
        const pref = normalize(stored);
        setPreferenceState(pref);
        applyUniwindTheme(pref);
      })
      .catch(() => {
        if (!cancelled) applyUniwindTheme("system");
      });
    return () => {
      cancelled = true;
    };
  }, [applyUniwindTheme]);

  const setPreference = useCallback(
    (pref: ThemePreference) => {
      setPreferenceState(pref);
      applyUniwindTheme(pref);
      AsyncStorage.setItem(KEY, pref).catch(() => {});
    },
    [applyUniwindTheme],
  );

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (preference !== "system") return preference;
    return currentUniwindTheme === "dark" ? "dark" : "light";
  }, [preference, currentUniwindTheme]);

  const isDark = resolvedTheme === "dark";

  const value = useMemo<ThemeContextType>(
    () => ({ preference, setPreference, resolvedTheme, isDark }),
    [preference, setPreference, resolvedTheme, isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}

