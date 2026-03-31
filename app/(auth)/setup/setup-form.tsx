"use client";

import { SubmitEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SetupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, email: email || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Setup failed");
        return;
      }

      router.push("/login?setup=complete");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
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
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          required
          autoComplete="name"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="admin"
          pattern="^[a-z0-9_]{3,30}$"
          title="3-30 characters: lowercase letters, numbers, underscores"
          required
          autoComplete="username"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">
          Lowercase letters, numbers, and underscores only
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">
          Email <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          autoComplete="email"
        />
      </div>

      <div className="rounded-xl border border-warning/20 bg-warning/8 px-4 py-3 text-sm text-foreground">
        The initial password comes from the{" "}
        <code className="rounded bg-warning/10 px-1.5 py-0.5 font-mono text-xs">
          SUPER_PASSWORD
        </code>{" "}
        environment variable. You&apos;ll be prompted to change it.
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Creating account\u2026" : "Create Account"}
      </Button>
    </form>
  );
}
