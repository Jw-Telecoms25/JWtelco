"use client";

import { Menu, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useUIStore } from "@/lib/stores/ui-store";

export function AdminTopbar() {
  const { user, signOut } = useAuth();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="font-semibold text-sm">Admin Panel</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-muted hidden sm:block">
              {user.first_name} {user.last_name}
            </span>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
