"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to change password");
        return;
      }

      setSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">
          Account Settings
        </h1>
        <p className="text-muted-foreground font-medium">
          Manage your security preferences and passwords
        </p>
      </div>

      <div className="rounded-4xl border border-border/60 bg-card/80 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur transition-shadow duration-300 hover:shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <h2 className="text-xl font-bold text-card-foreground mb-6 flex items-center gap-2">
          <svg aria-hidden="true" className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Change Password
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-5">
          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-5 py-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success/20 text-success px-5 py-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="font-medium">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-11"
              placeholder="Enter your current password\u2026"
            />
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="newPassword" className="font-medium">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              className="h-11"
              placeholder="At least 8 characters\u2026"
            />
            <p className="text-xs font-medium text-muted-foreground mt-1.5 ml-1">
              Must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-medium">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              className="h-11"
              placeholder="Repeat your new password\u2026"
            />
          </div>

          <div className="flex justify-end pt-6">
            <Button 
              type="submit" 
              disabled={loading}
              className="h-11 px-8 rounded-xl shadow-lg shadow-primary/20 font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Updating\u2026
                </span>
              ) : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
