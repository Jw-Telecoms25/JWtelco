"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, Bell, ChevronDown, User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useWallet } from "@/lib/hooks/use-wallet";
import { useUIStore } from "@/lib/stores/ui-store";
import { formatNaira } from "@/lib/utils/format";

export function Topbar() {
  const { user, signOut } = useAuth();
  const { balance } = useWallet();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
    : "?";

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: hamburger + greeting */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-elevated transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu size={22} />
          </button>
          <span className="text-sm text-muted hidden sm:inline">
            Hi,{" "}
            <span className="font-medium text-foreground">
              {user?.first_name ?? "there"}
            </span>
          </span>
        </div>

        {/* Right: balance, bell, avatar */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Wallet balance */}
          <div className="px-3 py-1.5 rounded-xl bg-surface-elevated border border-border text-sm font-semibold text-foreground">
            {formatNaira(balance)}
          </div>

          {/* Notification bell */}
          <Link
            href="/notifications"
            className="relative p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {/* Unread badge placeholder */}
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Link>

          {/* User dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-elevated transition-colors"
              aria-label="User menu"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-white text-xs font-bold">
                {initials}
              </div>
              <ChevronDown
                size={16}
                className={`text-muted transition-transform hidden sm:block ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg py-1 z-50">
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-surface-elevated transition-colors"
                >
                  <User size={16} className="text-muted" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
