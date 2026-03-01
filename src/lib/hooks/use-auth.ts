"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/lib/stores/ui-store";

export function useAuth() {
  const { user, isLoading } = useAuthStore();
  const supabase = useSupabase();
  const router = useRouter();
  const addToast = useUIStore((s) => s.addToast);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    addToast({ type: "info", title: "Signed out successfully" });
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin" || user?.role === "super_admin",
    isAgent: user?.role === "agent",
    signOut,
  };
}
