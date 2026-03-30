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
      <div className="bg-card text-card-foreground rounded-lg shadow-lg border border-border p-6">
        <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-lg text-sm">
          <p className="font-medium">Default password detected</p>
          <p className="mt-1">
            You are using the default admin password. Please change it in
            Settings after logging in.
          </p>
        </div>
        <p className="text-sm text-muted-foreground mt-3 text-center">
          Redirecting...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card text-card-foreground rounded-lg shadow-lg border border-border p-6 space-y-4"
    >
      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
          required
          autoComplete="username"
          spellCheck={false}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="mt-1"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in\u2026" : "Sign In"}
      </Button>
    </form>
  );
}
