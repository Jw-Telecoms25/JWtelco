"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Phone, Loader2, Eye, EyeOff } from "lucide-react";
import { loginUser, loginByPhone } from "@/lib/services/auth";
import { createClient } from "@/lib/supabase/client";
import { useUIStore } from "@/lib/stores/ui-store";

const NIGERIAN_PHONE_REGEX = /^0[7-9][01]\d{8}$/;

type LoginMode = "email" | "phone";

interface FormErrors {
  email?: string;
  password?: string;
  phone?: string;
}

function LoginErrorHandler() {
  const searchParams = useSearchParams();
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "invalid_link") {
      addToast({
        type: "error",
        title: "Link expired or invalid",
        message: "Please request a new confirmation email or try logging in.",
      });
    }
  }, [searchParams, addToast]);

  return null;
}

export function LoginForm() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const [mode, setMode] = useState<LoginMode>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: FormErrors = {};

    if (mode === "email") {
      if (!email.trim()) {
        next.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        next.email = "Enter a valid email address";
      }
    }

    if (mode === "phone") {
      if (!phone.trim()) {
        next.phone = "Phone number is required";
      } else if (!NIGERIAN_PHONE_REGEX.test(phone.replace(/\s/g, ""))) {
        next.phone = "Enter a valid Nigerian phone number (e.g. 08012345678)";
      }
    }

    if (!password) {
      next.password = "Password is required";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      let destination = "/dashboard";

      if (mode === "phone") {
        // Auth is fully server-side for phone login — email never sent to client
        const result = await loginByPhone({ phone: phone.replace(/\s/g, ""), password });
        if (["admin", "super_admin"].includes(result.role)) destination = "/admin";
      } else {
        const loginData = await loginUser({ email, password });
        if (loginData.user) {
          const supabase = createClient();
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", loginData.user.id)
            .single();
          if (profile && ["admin", "super_admin"].includes(profile.role)) {
            destination = "/admin";
          }
        }
      }

      addToast({ type: "success", title: "Welcome back!" });
      router.push(destination);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      addToast({
        type: "error",
        title: "Login failed",
        message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Suspense>
        <LoginErrorHandler />
      </Suspense>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Welcome back</h1>
        <p className="text-muted mt-1 text-sm">
          Sign in to your JWTelecoms account
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg bg-surface-elevated p-1 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("email");
            setErrors({});
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "email"
              ? "bg-white text-navy shadow-sm"
              : "text-muted hover:text-navy"
          }`}
          aria-label="Login with email"
        >
          <Mail className="w-4 h-4" />
          Email
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("phone");
            setErrors({});
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "phone"
              ? "bg-white text-navy shadow-sm"
              : "text-muted hover:text-navy"
          }`}
          aria-label="Login with phone number"
        >
          <Phone className="w-4 h-4" />
          Phone
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {mode === "email" ? (
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-navy mb-1.5"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                aria-label="Email address"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                  errors.email ? "border-red-400" : "border-border"
                }`}
              />
            </div>
            {errors.email && (
              <p id="login-email-error" className="text-red-500 text-xs mt-1">
                {errors.email}
              </p>
            )}
          </div>
        ) : (
          <div>
            <label
              htmlFor="login-phone"
              className="block text-sm font-medium text-navy mb-1.5"
            >
              Phone number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                id="login-phone"
                type="tel"
                autoComplete="tel"
                aria-label="Phone number"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "login-phone-error" : undefined}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
                }}
                placeholder="08012345678"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                  errors.phone ? "border-red-400" : "border-border"
                }`}
              />
            </div>
            {errors.phone && (
              <p id="login-phone-error" className="text-red-500 text-xs mt-1">
                {errors.phone}
              </p>
            )}
          </div>
        )}

        {/* Password */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-navy mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-label="Password"
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "login-password-error" : undefined
              }
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="Enter your password"
              className={`w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                errors.password ? "border-red-400" : "border-border"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="login-password-error" className="text-red-500 text-xs mt-1">
              {errors.password}
            </p>
          )}
        </div>

        {/* Forgot password link */}
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-accent hover:text-accent-dim transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          aria-label="Login"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-dim transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-accent font-medium hover:text-accent-dim transition-colors"
        >
          Create account
        </Link>
      </p>
    </motion.div>
  );
}
