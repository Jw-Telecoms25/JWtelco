"use client";

import { useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useWallet } from "@/lib/hooks/use-wallet";

interface ServiceFormProps {
  title: string;
  children: React.ReactNode;
  onSubmit: () => Promise<{ success: boolean; message?: string; [key: string]: unknown }>;
  submitLabel?: string;
  successMessage?: string;
}

export default function ServiceForm({
  title,
  children,
  onSubmit,
  submitLabel = "Purchase",
  successMessage,
}: ServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: Record<string, any>;
  } | null>(null);
  const addToast = useUIStore((s) => s.addToast);
  const { refreshBalance } = useWallet();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await onSubmit();
      if (res.success) {
        setResult({
          success: true,
          message: successMessage || res.message || "Purchase successful!",
          data: res as Record<string, unknown>,
        });
        addToast({ type: "success", title: successMessage || res.message || "Purchase successful!" });
        refreshBalance();
      } else {
        throw new Error(res.message || "Purchase failed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setResult({ success: false, message });
      addToast({ type: "error", title: "Purchase Failed", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">{title}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
          {children}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dim text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 p-4 rounded-xl border ${
            result.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium">{result.success ? "Success" : "Failed"}</p>
              <p className="text-sm mt-1">{result.message}</p>
              {result.success && result.data?.token && (
                <div className="mt-2 p-3 bg-white/50 rounded-lg">
                  <p className="text-xs font-medium uppercase tracking-wider mb-1">
                    Electricity Token
                  </p>
                  <p className="font-mono text-lg font-bold">
                    {String(result.data.token)}
                  </p>
                  {result.data.units && (
                    <p className="text-sm mt-1">Units: {String(result.data.units)}</p>
                  )}
                </div>
              )}
              {result.success && result.data?.pins && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider">
                    Exam Pins
                  </p>
                  {(result.data.pins as Array<{ pin: string; serial: string }>).map(
                    (p, i) => (
                      <div key={i} className="p-2 bg-white/50 rounded-lg">
                        <p className="font-mono text-sm">PIN: {p.pin}</p>
                        <p className="font-mono text-xs text-muted">S/N: {p.serial}</p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
