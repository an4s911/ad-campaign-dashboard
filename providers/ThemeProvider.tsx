"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";

  const savedTheme = window.localStorage.getItem("theme");
  return isTheme(savedTheme) ? savedTheme : "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (nextTheme: Theme) => {
      root.classList.remove("light", "dark");

      if (nextTheme === "system") {
        root.classList.add(mediaQuery.matches ? "dark" : "light");
        return;
      }

      root.classList.add(nextTheme);
    };

    applyTheme(theme);

    if (theme !== "system") {
      return;
    }

    const listener = (event: MediaQueryListEvent) => {
      root.classList.remove("light", "dark");
      root.classList.add(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      window.localStorage.setItem("theme", newTheme);
      setThemeState(newTheme);
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
