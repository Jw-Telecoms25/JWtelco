"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight, X } from "lucide-react";

export function PinSetupBanner() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wallet/pin")
      .then((r) => r.json())
      .then((d) => {
        if (d.hasPin === false) setShow(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !show) return null;

  return (
    <div className="relative flex items-start sm:items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
        <ShieldAlert className="w-5 h-5 text-amber-600" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">Set your transaction PIN</p>
        <p className="text-xs text-amber-700 mt-0.5">
          A PIN is required before every purchase. Set one now to start buying airtime, data, and more.
        </p>
      </div>

      <Link
        href="/profile"
        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors"
      >
        Set PIN
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>

      <button
        onClick={() => setShow(false)}
        className="flex-shrink-0 p-1 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
