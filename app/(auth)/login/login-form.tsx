"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm({ from }: { from?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [defaultPwWarning, setDefaultPwWarning] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.usingDefaultPassword) {
        setDefaultPwWarning(true);
        setTimeout(() => {
          router.push(from || "/");
          router.refresh();
        }, 2000);
        return;
      }

      router.push(from || "/");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (defaultPwWarning) {
    return (
      <div className="shadow-card rounded-2xl border border-border bg-card p-6 animate-scale-in">
        <div className="rounded-xl border border-warning/20 bg-warning/8 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">Default password detected</p>
          <p className="mt-1 text-muted-foreground">
            Please change it in Settings after logging in.
          </p>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <svg className="h-4 w-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {"Redirecting\u2026"}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shadow-card rounded-2xl border border-border bg-card p-6 space-y-5"
    >
      {error && (
        <div className="animate-slide-down rounded-xl border border-error/20 bg-error/8 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={"Enter your username\u2026"}
          required
          autoComplete="username"
          spellCheck={false}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={"Enter your password\u2026"}
          required
          autoComplete="current-password"
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {"Signing in\u2026"}
          </span>
        ) : "Sign In"}
      </Button>
    </form>
  );
}
