"use client";

import { useEffect } from "react";
import { useSupabase } from "./SupabaseProvider";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useWalletStore } from "@/lib/stores/wallet-store";
import type { Profile } from "@/lib/services/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabase();
  const { setUser, setLoading, reset: resetAuth } = useAuthStore();
  const { setWallet, reset: resetWallet } = useWalletStore();

  useEffect(() => {
    async function loadUser(userId: string) {
      const [profileRes, walletRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase
          .from("wallets")
          .select("*")
          .eq("user_id", userId)
          .eq("type", "main")
          .single(),
      ]);

      if (profileRes.data) {
        setUser(profileRes.data as Profile);
      }
      if (walletRes.data) {
        setWallet(walletRes.data);
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        loadUser(user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id);
      } else {
        resetAuth();
        resetWallet();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, setUser, setLoading, setWallet, resetAuth, resetWallet]);

  return <>{children}</>;
}
