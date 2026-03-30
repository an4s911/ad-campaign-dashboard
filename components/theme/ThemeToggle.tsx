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
        className={`flex items-center rounded-lg border border-border bg-muted/50 p-0.5 ${className}`}
      >
        <div className="h-6 w-6 rounded-md" />
        <div className="h-6 w-6 rounded-md" />
        <div className="h-6 w-6 rounded-md" />
      </div>
    );
  }

  const options = [
    { value: "light" as const, label: "Light mode", icon: (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    )},
    { value: "system" as const, label: "System theme", icon: (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    )},
    { value: "dark" as const, label: "Dark mode", icon: (
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    )},
  ];

  return (
    <div className={`flex items-center rounded-lg border border-border bg-muted/50 p-0.5 ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-150 ${
            theme === opt.value
              ? "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={opt.label}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}
