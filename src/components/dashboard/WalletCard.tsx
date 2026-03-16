"use client";

import Link from "next/link";
import { ArrowUpRight, Eye, EyeOff, Plus } from "lucide-react";
import { useState } from "react";
import { useWallet } from "@/lib/hooks/use-wallet";
import { formatNaira } from "@/lib/utils/format";
import { Spinner } from "@/components/ui/Spinner";
import { JWGlobe } from "@/components/ui/JWLogo";

export function WalletCard() {
  const { balance, isLoading } = useWallet();
  const [hidden, setHidden] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1628] via-[#0f2240] to-[#0a1628] p-6 sm:p-7 text-white shadow-xl shadow-navy/30">
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Glow */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-accent/15 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-accent/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4" />

      {/* Globe watermark */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-[0.06]">
        <JWGlobe size={120} />
      </div>

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <span className="text-sm text-white/50 font-medium">Wallet Balance</span>
          </div>
          <button
            onClick={() => setHidden(!hidden)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
            aria-label={hidden ? "Show balance" : "Hide balance"}
          >
            {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Balance */}
        <div className="mb-7">
          {isLoading ? (
            <Spinner size="md" className="text-white" />
          ) : hidden ? (
            <div className="text-3xl sm:text-4xl font-bold tracking-tight">••••••</div>
          ) : (
            <div className="text-3xl sm:text-4xl font-bold tracking-tight">
              {formatNaira(balance)}
            </div>
          )}
          <p className="text-xs text-white/30 mt-1.5">Available balance</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/wallet"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-navy font-semibold text-sm hover:bg-accent-bright transition-all hover:shadow-lg hover:shadow-accent/25 active:scale-[0.97]"
          >
            <Plus size={16} />
            Fund Wallet
          </Link>
          <Link
            href="/transactions"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white/80 font-medium text-sm hover:bg-white/15 transition-all"
          >
            History
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
