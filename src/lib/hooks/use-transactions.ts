"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Transaction } from "@/lib/services/types";

export function useTransactions(limit = 20) {
  const supabase = useSupabase();
  const user = useAuthStore((s) => s.user);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  async function load(page = 0) {
    if (!user) return;
    setIsLoading(true);
    const from = page * limit;
    const to = from + limit - 1;

    const { data, count } = await supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data) setTransactions(data as Transaction[]);
    if (count !== null) setTotal(count);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { transactions, isLoading, total, reload: load };
}
