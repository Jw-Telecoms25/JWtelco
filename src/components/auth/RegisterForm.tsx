"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Phone,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  Gift,
} from "lucide-react";
import { registerUser } from "@/lib/services/auth";
import { useUIStore } from "@/lib/stores/ui-store";

const NIGERIAN_PHONE_REGEX = /^0[7-9][01]\d{8}$/;

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
  acceptTerms: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

function getPasswordStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-400" };
  if (score <= 2) return { score: 2, label: "Fair", color: "bg-amber-400" };
  if (score <= 3) return { score: 3, label: "Good", color: "bg-yellow-400" };
  if (score <= 4) return { score: 4, label: "Strong", color: "bg-emerald-400" };
  return { score: 5, label: "Very strong", color: "bg-emerald-500" };
}

export function RegisterForm() {
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const next: FormErrors = {};

    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.lastName.trim()) next.lastName = "Last name is required";

    if (!form.phone.trim()) {
      next.phone = "Phone number is required";
    } else if (!NIGERIAN_PHONE_REGEX.test(form.phone.replace(/\s/g, ""))) {
      next.phone = "Enter a valid Nigerian phone number (e.g. 08012345678)";
    }

    if (!form.email.trim()) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email address";
    }

    if (!form.password) {
      next.password = "Password is required";
    } else if (form.password.length < 8) {
      next.password = "Password must be at least 8 characters";
    }

    if (!form.confirmPassword) {
      next.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      next.confirmPassword = "Passwords do not match";
    }

    if (!form.acceptTerms) {
      next.acceptTerms = "You must accept the terms and conditions";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const data = await registerUser({
        email: form.email,
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.replace(/\s/g, ""),
        referralCode: form.referralCode.trim() || undefined,
      });

      // If Supabase requires email confirmation, the session will be null
      if (data.session) {
        addToast({ type: "success", title: "Account created!" });
        router.push("/dashboard");
      } else {
        setSuccess(true);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      addToast({
        type: "error",
        title: "Registration failed",
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
          We sent a confirmation link to{" "}
          <span className="font-medium text-navy">{form.email}</span>. Click the
          link to activate your account.
        </p>
        <Link
          href="/login"
          className="text-sm text-accent font-medium hover:text-accent-dim transition-colors"
        >
          Back to login
        </Link>
      </motion.div>
    );
  }

  const strength = form.password ? getPasswordStrength(form.password) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Create account</h1>
        <p className="text-muted mt-1 text-sm">
          Join thousands of Nigerians on JWTelecoms
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="reg-first-name"
              className="block text-sm font-medium text-navy mb-1.5"
            >
              First name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                id="reg-first-name"
                type="text"
                autoComplete="given-name"
                aria-label="First name"
                aria-invalid={!!errors.firstName}
                aria-describedby={
                  errors.firstName ? "reg-first-name-error" : undefined
                }
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                placeholder="John"
                className={`w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                  errors.firstName ? "border-red-400" : "border-border"
                }`}
              />
            </div>
            {errors.firstName && (
              <p
                id="reg-first-name-error"
                className="text-red-500 text-xs mt-1"
              >
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-last-name"
              className="block text-sm font-medium text-navy mb-1.5"
            >
              Last name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                id="reg-last-name"
                type="text"
                autoComplete="family-name"
                aria-label="Last name"
                aria-invalid={!!errors.lastName}
                aria-describedby={
                  errors.lastName ? "reg-last-name-error" : undefined
                }
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                placeholder="Doe"
                className={`w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                  errors.lastName ? "border-red-400" : "border-border"
                }`}
              />
            </div>
            {errors.lastName && (
              <p
                id="reg-last-name-error"
                className="text-red-500 text-xs mt-1"
              >
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="reg-phone"
            className="block text-sm font-medium text-navy mb-1.5"
          >
            Phone number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              aria-label="Phone number"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "reg-phone-error" : undefined}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="08012345678"
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                errors.phone ? "border-red-400" : "border-border"
              }`}
            />
          </div>
          {errors.phone && (
            <p id="reg-phone-error" className="text-red-500 text-xs mt-1">
              {errors.phone}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="reg-email"
            className="block text-sm font-medium text-navy mb-1.5"
          >
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              aria-label="Email address"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "reg-email-error" : undefined}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                errors.email ? "border-red-400" : "border-border"
              }`}
            />
          </div>
          {errors.email && (
            <p id="reg-email-error" className="text-red-500 text-xs mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="reg-password"
            className="block text-sm font-medium text-navy mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-label="Password"
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "reg-password-error" : undefined
              }
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Min. 8 characters"
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
            <p id="reg-password-error" className="text-red-500 text-xs mt-1">
              {errors.password}
            </p>
          )}
          {/* Strength indicator */}
          {strength && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= strength.score ? strength.color : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted mt-1">{strength.label}</p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="reg-confirm-password"
            className="block text-sm font-medium text-navy mb-1.5"
          >
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="reg-confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-label="Confirm password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword
                  ? "reg-confirm-password-error"
                  : undefined
              }
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="Re-enter your password"
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-white outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-accent/20 focus:border-accent ${
                errors.confirmPassword ? "border-red-400" : "border-border"
              }`}
            />
          </div>
          {errors.confirmPassword && (
            <p
              id="reg-confirm-password-error"
              className="text-red-500 text-xs mt-1"
            >
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Referral Code (optional) */}
        <div>
          <label
            htmlFor="reg-referral"
            className="block text-sm font-medium text-navy mb-1.5"
          >
            Referral code <span className="text-muted font-normal">(optional)</span>
          </label>
          <div className="relative">
            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              id="reg-referral"
              type="text"
              value={form.referralCode}
              onChange={(e) => update("referralCode", e.target.value.toUpperCase())}
              placeholder="e.g. A1B2C3D4"
              maxLength={8}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border text-sm bg-white outline-none transition-colors placeholder:text-muted/60 focus:ring-2 focus:ring-accent/20 focus:border-accent uppercase"
            />
          </div>
        </div>

        {/* Terms */}
        <div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.acceptTerms}
              onChange={(e) => update("acceptTerms", e.target.checked)}
              aria-label="Accept terms and conditions"
              className="mt-0.5 w-4 h-4 rounded border-border text-accent focus:ring-accent/20"
            />
            <span className="text-sm text-muted">
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-accent hover:text-accent-dim transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-accent hover:text-accent-dim transition-colors"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-red-500 text-xs mt-1">{errors.acceptTerms}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          aria-label="Create account"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent-dim transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-accent font-medium hover:text-accent-dim transition-colors"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
