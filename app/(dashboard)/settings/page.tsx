"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  function showToast(message: string, type: "error" | "success") {
    setToast({ message, type });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
    setTimeout(() => setToast(null), 3400);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    const errs: string[] = [];
    if (newPassword.length < 8) errs.push("New password must be at least 8 characters");
    if (newPassword !== confirmPassword) errs.push("Passwords do not match");
    if (errs.length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to update password", "error");
        return;
      }
      showToast("Password updated successfully", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      <div
        aria-live="polite"
        className={`fixed right-6 top-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
          toastVisible ? "toast-enter" : toast ? "toast-exit" : "pointer-events-none opacity-0"
        } ${toast?.type === "error" ? "bg-error text-error-foreground" : "bg-success text-success-foreground"}`}
      >
        {toast?.message}
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
          <div className="flex items-center gap-3 pb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <svg aria-hidden="true" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Change Password</h2>
              <p className="text-xs text-muted-foreground">Update your account password</p>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="animate-slide-down rounded-xl border border-error/20 bg-error/8 px-4 py-3 text-sm text-error space-y-1">
              {errors.map((err, i) => <p key={i}>{err}</p>)}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder={"Enter your current password\u2026"}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              placeholder={"At least 8 characters\u2026"}
            />
            <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              placeholder={"Repeat your new password\u2026"}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading} size="lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {"Updating\u2026"}
                </span>
              ) : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
