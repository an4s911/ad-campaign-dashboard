"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "@/providers/ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className={`flex items-center space-x-2 rounded-full border border-slate-200 bg-white/50 p-1 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/50 ${className}`}
      >
        <div className="h-8.5 w-8.5 rounded-full" />
        <div className="h-8.5 w-8.5 rounded-full" />
        <div className="h-8.5 w-8.5 rounded-full" />
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 rounded-full border border-slate-200 bg-white/50 p-1 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/50 ${className}`}>
      <button
        onClick={() => setTheme("light")}
        className={`rounded-full p-2 transition-colors ${
          theme === "light"
            ? "bg-white text-amber-500 shadow-sm dark:bg-slate-700"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
        aria-label="Light mode"
      >
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" /><path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" /><path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </button>

      <button
        onClick={() => setTheme("system")}
        className={`rounded-full p-2 transition-colors ${
          theme === "system"
            ? "bg-white text-indigo-500 shadow-sm dark:bg-slate-700"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
        aria-label="System theme"
      >
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`rounded-full p-2 transition-colors ${
          theme === "dark"
            ? "bg-white text-indigo-400 shadow-sm dark:bg-slate-700"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        }`}
        aria-label="Dark mode"
      >
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </button>
    </div>
  );
}
