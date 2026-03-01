"use client";

import { useWalletStore } from "@/lib/stores/wallet-store";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useAuthStore } from "@/lib/stores/auth-store";

export function useWallet() {
  const { wallet, isLoading } = useWalletStore();
  const { setWallet } = useWalletStore();
  const supabase = useSupabase();
  const user = useAuthStore((s) => s.user);

  async function refreshBalance() {
    if (!user) return;
    const { data } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "main")
      .single();
    if (data) setWallet(data);
  }

  return {
    wallet,
    balance: wallet?.balance ?? 0,
    isLoading,
    refreshBalance,
  };
}
