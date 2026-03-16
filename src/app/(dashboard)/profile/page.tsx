"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Mail, Phone, Lock, Loader2, Gift, Copy, Users, ShieldCheck } from "lucide-react";
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

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Referral stats
  const [referral, setReferral] = useState<{ referralCode: string; totalReferred: number; totalBonusKobo: number } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // PIN management
  const [hasPin, setHasPin] = useState(false);
  const [pinLoading, setPinLoading] = useState(true);
  const [pinNewVal, setPinNewVal] = useState("");
  const [pinConfirmVal, setPinConfirmVal] = useState("");
  const [pinCurrentVal, setPinCurrentVal] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);

  const fetchReferral = useCallback(async () => {
    try {
      const res = await fetch("/api/referrals");
      if (res.ok) setReferral(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchReferral(); }, [fetchReferral]);

  useEffect(() => {
    fetch("/api/wallet/pin")
      .then((r) => r.json())
      .then((d) => setHasPin(d.hasPin === true))
      .catch(() => {})
      .finally(() => setPinLoading(false));
  }, []);

  async function handleSavePin(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pinNewVal)) {
      addToast({ type: "error", title: "PIN must be 4–6 digits" });
      return;
    }
    if (pinNewVal !== pinConfirmVal) {
      addToast({ type: "error", title: "PINs do not match" });
      return;
    }
    setIsSavingPin(true);
    try {
      const body: Record<string, string> = { pin: pinNewVal };
      if (hasPin) body.currentPin = pinCurrentVal;
      const res = await fetch("/api/wallet/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHasPin(true);
      setPinNewVal("");
      setPinConfirmVal("");
      setPinCurrentVal("");
      addToast({ type: "success", title: hasPin ? "PIN changed successfully" : "Transaction PIN set" });
    } catch (err) {
      addToast({ type: "error", title: err instanceof Error ? err.message : "Failed to save PIN" });
    } finally {
      setIsSavingPin(false);
    }
  }

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

      {/* Referral Section */}
      {referral && (
        <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-accent" />
            <h2 className="font-semibold">Refer & Earn</h2>
          </div>
          <p className="text-sm text-muted">
            Share your referral code with friends. You both get <strong className="text-navy">₦100</strong> when they make their first purchase.
          </p>

          {/* Referral Code */}
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 bg-surface-elevated rounded-xl font-mono text-lg font-bold tracking-wider text-center text-navy">
              {referral.referralCode}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(referral.referralCode);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="px-4 py-3 rounded-xl border border-border hover:bg-surface-elevated transition-colors"
              aria-label="Copy referral code"
            >
              {copiedCode ? <span className="text-xs text-accent font-medium">Copied!</span> : <Copy className="w-4 h-4 text-muted" />}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-elevated rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-muted" />
              </div>
              <p className="text-2xl font-bold text-navy">{referral.totalReferred}</p>
              <p className="text-xs text-muted">People Referred</p>
            </div>
            <div className="bg-surface-elevated rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Gift className="w-4 h-4 text-muted" />
              </div>
              <p className="text-2xl font-bold text-accent">₦{(referral.totalBonusKobo / 100).toLocaleString()}</p>
              <p className="text-xs text-muted">Total Earned</p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction PIN */}
      {!pinLoading && (
        <form onSubmit={handleSavePin} className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h2 className="font-semibold">{hasPin ? "Change Transaction PIN" : "Set Transaction PIN"}</h2>
          </div>
          <p className="text-sm text-muted">
            {hasPin
              ? "Your PIN is required before every purchase."
              : "Set a 4–6 digit PIN to secure your purchases. You'll enter it before every transaction."}
          </p>

          {hasPin && (
            <div>
              <label className="block text-sm font-medium mb-1">Current PIN</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinCurrentVal}
                  onChange={(e) => setPinCurrentVal(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter current PIN"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">New PIN</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinNewVal}
                onChange={(e) => setPinNewVal(e.target.value.replace(/\D/g, ""))}
                placeholder="4–6 digit PIN"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm New PIN</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pinConfirmVal}
                onChange={(e) => setPinConfirmVal(e.target.value.replace(/\D/g, ""))}
                placeholder="Repeat PIN"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingPin}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dim text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {isSavingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {hasPin ? "Change PIN" : "Set PIN"}
          </button>
        </form>
      )}

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
