"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { resetPassword } from "@/lib/services/auth";
import { useUIStore } from "@/lib/stores/ui-store";

export function ForgotPasswordForm() {
  const addToast = useUIStore((s) => s.addToast);

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
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
      await resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      addToast({
        type: "error",
        title: "Request failed",
        message,
      });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
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
        <h2 className="text-xl font-bold text-navy mb-2">Check your email</h2>
        <p className="text-sm text-muted mb-6">
          We sent a password reset link to{" "}
          <span className="font-medium text-navy">{email}</span>. Click the link
          to reset your password.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-accent font-medium hover:text-accent-dim transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
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
        <h1 className="text-2xl font-bold text-navy">Reset password</h1>
        <p className="text-muted mt-1 text-sm">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="forgot-email"
            className="block text-sm font-medium text-navy mb-1.5"
          >
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              aria-label="Email address"
              aria-invalid={!!error}
              aria-describedby={error ? "forgot-email-error" : undefined}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              placeholder="you@example.com"
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                error ? "border-red-400" : "border-border"
              }`}
            />
          </div>
          {error && (
            <p id="forgot-email-error" className="text-red-500 text-xs mt-1">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-label="Send reset link"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-dim transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-accent font-medium hover:text-accent-dim transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </p>
    </motion.div>
  );
}
