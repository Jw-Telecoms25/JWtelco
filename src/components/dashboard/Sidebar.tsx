"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Phone,
  Wifi,
  Zap,
  Tv,
  GraduationCap,
  Wallet,
  Receipt,
  User,
  Bell,
  Users,
  Layers,
  X,
} from "lucide-react";
import { useUIStore } from "@/lib/stores/ui-store";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navGroups: (NavItem | "separator")[][] = [
  [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Buy Airtime", href: "/buy/airtime", icon: <Phone size={20} /> },
    { label: "Buy Data", href: "/buy/data", icon: <Wifi size={20} /> },
    { label: "Electricity", href: "/buy/electricity", icon: <Zap size={20} /> },
    { label: "Cable TV", href: "/buy/cable", icon: <Tv size={20} /> },
    { label: "Exam Pins", href: "/buy/exam-pins", icon: <GraduationCap size={20} /> },
    { label: "Bulk Airtime", href: "/buy/bulk-airtime", icon: <Layers size={20} /> },
    "separator",
    { label: "Wallet", href: "/wallet", icon: <Wallet size={20} /> },
    { label: "Transactions", href: "/transactions", icon: <Receipt size={20} /> },
    { label: "Beneficiaries", href: "/beneficiaries", icon: <Users size={20} /> },
    "separator",
    { label: "Profile", href: "/profile", icon: <User size={20} /> },
    { label: "Notifications", href: "/notifications", icon: <Bell size={20} /> },
  ],
];

const navItems = navGroups[0];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <Link
          href="/dashboard"
          className="text-xl font-bold text-white tracking-tight"
          onClick={onNavigate}
        >
          JW<span className="text-accent">Telecoms</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item, i) => {
          if (item === "separator") {
            return (
              <div key={`sep-${i}`} className="my-3 border-t border-white/10" />
            );
          }

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-colors
                ${
                  isActive
                    ? "bg-accent text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      {/* Desktop sidebar - fixed */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-navy">
        <NavContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-navy lg:hidden"
            >
              {/* Close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>

              <NavContent onNavigate={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
