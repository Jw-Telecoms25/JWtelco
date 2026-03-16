"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useUIStore } from "@/lib/stores/ui-store";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useSupabase();
  const addToast = useUIStore((s) => s.addToast);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function validate(): boolean {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return false;
    }
    setError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      addToast({ type: "error", title: "Error", message });
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center py-4"
      >
        <div className="w-16 h-16 rounded-full bg-emerald/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald" />
        </div>
        <h2 className="text-xl font-bold text-navy mb-2">Password updated</h2>
        <p className="text-sm text-muted">Redirecting you to login…</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Set new password</h1>
        <p className="text-muted mt-1 text-sm">
          Choose a strong password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="rp-password" className="block text-sm font-medium text-navy mb-1.5">
            New password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="rp-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
              placeholder="Min 8 characters"
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                error ? "border-red-400" : "border-border"
              }`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="rp-confirm" className="block text-sm font-medium text-navy mb-1.5">
            Confirm new password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="rp-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); if (error) setError(""); }}
              placeholder="Repeat password"
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                error ? "border-red-400" : "border-border"
              }`}
            />
          </div>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-dim transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : "Set New Password"}
        </button>
      </form>
    </motion.div>
  );
}
