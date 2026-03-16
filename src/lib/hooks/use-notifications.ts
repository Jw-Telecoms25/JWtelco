"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useAuthStore } from "@/lib/stores/auth-store";

export function useUnreadNotifications() {
  const supabase = useSupabase();
  const user = useAuthStore((s) => s.user);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false)
      .or(`user_id.eq.${user.id},target.eq.all`);

    setUnreadCount(count ?? 0);
    setIsLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    fetchCount();

    function onFocus() {
      fetchCount();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchCount]);

  return { unreadCount, isLoading, refetch: fetchCount };
}
