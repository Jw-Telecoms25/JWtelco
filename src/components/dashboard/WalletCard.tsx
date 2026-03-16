"use client";

import Link from "next/link";
import { Wallet, Plus } from "lucide-react";
import { useWallet } from "@/lib/hooks/use-wallet";
import { formatNaira } from "@/lib/utils/format";
import { Spinner } from "@/components/ui/Spinner";

export function WalletCard() {
  const { balance, isLoading } = useWallet();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-accent-dim p-6 text-white">
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={18} className="text-accent-bright" />
          <span className="text-sm text-gray-300">Wallet Balance</span>
        </div>

        <div className="text-3xl font-bold tracking-tight mt-2 mb-6">
          {isLoading ? (
            <Spinner size="md" className="text-white" />
          ) : (
            formatNaira(balance)
          )}
        </div>

        <Link
          href="/wallet"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-medium transition-colors backdrop-blur-sm"
        >
          <Plus size={16} />
          Fund Wallet
        </Link>
      </div>
    </div>
  );
}
