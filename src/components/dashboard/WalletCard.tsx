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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent via-[#6b0ab0] to-[#2d0060] p-6 sm:p-7 text-white shadow-2xl shadow-accent/20">
      {/* Shimmer overlays */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-[90px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4" />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Globe watermark */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.07]">
        <JWGlobe size={110} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <span className="text-sm text-white/60 font-medium">Wallet Balance</span>
          </div>
          <button
            onClick={() => setHidden(!hidden)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
            aria-label={hidden ? "Show balance" : "Hide balance"}
          >
            {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {/* Balance */}
        <div className="mb-7">
          {isLoading ? (
            <Spinner size="md" className="text-white" />
          ) : hidden ? (
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">••••••</div>
          ) : (
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {formatNaira(balance)}
            </div>
          )}
          <p className="text-xs text-white/35 mt-1.5">Available balance</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/wallet"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-accent font-bold text-sm hover:bg-white/90 transition-all hover:shadow-lg active:scale-[0.97]"
          >
            <Plus size={15} />
            Fund Wallet
          </Link>
          <Link
            href="/transactions"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 text-white/85 font-medium text-sm hover:bg-white/20 transition-all"
          >
            History
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
