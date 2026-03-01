"use client";

import { useState } from "react";
import { User, Mail, Phone, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useUIStore } from "@/lib/stores/ui-store";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function ProfilePage() {
  const { user } = useAuth();
  const supabase = useSupabase();
  const addToast = useUIStore((s) => s.addToast);
  const setUser = useAuthStore((s) => s.setUser);

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ first_name: firstName, last_name: lastName, phone })
        .eq("id", user.id);

      if (error) throw error;

      setUser({ ...user, first_name: firstName, last_name: lastName, phone });
      addToast({ type: "success", title: "Profile updated" });
    } catch (err) {
      addToast({ type: "error", title: "Failed to update profile" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      addToast({ type: "error", title: "Password must be at least 8 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast({ type: "error", title: "Passwords do not match" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      addToast({ type: "success", title: "Password changed successfully" });
    } catch (err) {
      addToast({
        type: "error",
        title: "Failed to change password",
        message: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Profile Info */}
      <form onSubmit={handleSaveProfile} className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-semibold">Personal Information</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-elevated text-muted cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-muted mt-1">Email cannot be changed</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              aria-label="First name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              aria-label="Last name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              aria-label="Phone number"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted">
          <User className="w-3.5 h-3.5" />
          <span>Role: {user.role} | Status: {user.status}</span>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dim text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save Changes
        </button>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="bg-surface rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-semibold">Change Password</h2>

        <div>
          <label className="block text-sm font-medium mb-1">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              aria-label="New password"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              aria-label="Confirm password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isChangingPassword}
          className="w-full flex items-center justify-center gap-2 bg-navy hover:bg-navy-light text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Change Password
        </button>
      </form>
    </div>
  );
}
