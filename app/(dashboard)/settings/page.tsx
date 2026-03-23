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
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Account Settings
        </h1>
        <p className="text-slate-500 font-medium">
          Manage your security preferences and passwords
        </p>
      </div>

      <div className="rounded-4xl border border-slate-200/60 bg-white/80 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur transition-all duration-300 hover:shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Change Password
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 px-5 py-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-5 py-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-slate-700 dark:text-slate-700 font-medium">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="h-11 rounded-xl transition-shadow focus-visible:ring-indigo-500 dark:bg-white dark:border-slate-300 dark:text-slate-900 dark:placeholder:text-slate-400"
              placeholder="Enter your current password"
            />
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="newPassword" className="text-slate-700 dark:text-slate-700 font-medium">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="h-11 rounded-xl transition-shadow focus-visible:ring-indigo-500 dark:bg-white dark:border-slate-300 dark:text-slate-900 dark:placeholder:text-slate-400"
              placeholder="At least 8 characters"
            />
            <p className="text-xs font-medium text-slate-400 mt-1.5 ml-1">
              Must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-700 font-medium">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="h-11 rounded-xl transition-shadow focus-visible:ring-indigo-500 dark:bg-white dark:border-slate-300 dark:text-slate-900 dark:placeholder:text-slate-400"
              placeholder="Repeat your new password"
            />
          </div>

          <div className="flex justify-end pt-6">
            <Button 
              type="submit" 
              disabled={loading}
              className="h-11 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Updating...
                </span>
              ) : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
