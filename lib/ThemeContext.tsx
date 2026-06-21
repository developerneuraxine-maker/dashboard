"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export const THEMES = {
  dark: {
    bg: "#0B0E14", bgElev: "#131722", bgElev2: "#1B2130",
    border: "#232A3B", borderSoft: "#1C2433",
    text: "#E7EAF0", textMuted: "#99A2B5", textFaint: "#5C6781",
    brand: "#7C6BF0", brand2: "#A78BFA", brandSoft: "rgba(124,107,240,0.14)",
    success: "#34D399", successSoft: "rgba(52,211,153,0.14)",
    warn: "#FBBF24", warnSoft: "rgba(251,191,36,0.14)",
    danger: "#FB7185", dangerSoft: "rgba(251,113,133,0.14)",
    info: "#38BDF8", infoSoft: "rgba(56,189,248,0.14)",
    shadow: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25)",
  },
  light: {
    bg: "#F6F7FB", bgElev: "#FFFFFF", bgElev2: "#F1F3F9",
    border: "#E6E9F2", borderSoft: "#EEF1F7",
    text: "#161A23", textMuted: "#5A6478", textFaint: "#9AA3B5",
    brand: "#6D5DE6", brand2: "#8B7CF0", brandSoft: "rgba(109,93,230,0.10)",
    success: "#10B981", successSoft: "rgba(16,185,129,0.10)",
    warn: "#D97706", warnSoft: "rgba(217,119,6,0.10)",
    danger: "#E11D48", dangerSoft: "rgba(225,29,72,0.10)",
    info: "#0EA5E9", infoSoft: "rgba(14,165,233,0.10)",
    shadow: "0 1px 2px rgba(16,24,40,0.06), 0 8px 24px rgba(16,24,40,0.06)",
  },
};

export type ThemeMode = "dark" | "light";
export type ThemeTokens = typeof THEMES.dark;

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  t: ThemeTokens;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme-mode") as ThemeMode;
    if (saved === "dark" || saved === "light") {
      setModeState(saved);
    }
    setMounted(true);
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("theme-mode", newMode);
  };

  const t = THEMES[mode];

  // Prevent flash by yielding rendering after mount on client
  if (!mounted) {
    return <div style={{ background: THEMES.dark.bg }} className="h-full min-h-screen" />;
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
