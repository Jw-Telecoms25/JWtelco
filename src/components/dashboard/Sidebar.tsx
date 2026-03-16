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
  Shield,
  Home,
} from "lucide-react";
import { useUIStore } from "@/lib/stores/ui-store";
import { useAuth } from "@/lib/hooks/use-auth";
import { JWGlobe } from "@/components/ui/JWLogo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: (NavItem | "separator")[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Buy Airtime", href: "/buy/airtime", icon: <Phone size={18} /> },
  { label: "Buy Data", href: "/buy/data", icon: <Wifi size={18} /> },
  { label: "Electricity", href: "/buy/electricity", icon: <Zap size={18} /> },
  { label: "Cable TV", href: "/buy/cable", icon: <Tv size={18} /> },
  { label: "Exam Pins", href: "/buy/exam-pins", icon: <GraduationCap size={18} /> },
  { label: "Bulk Airtime", href: "/buy/bulk-airtime", icon: <Layers size={18} /> },
  "separator",
  { label: "Wallet", href: "/wallet", icon: <Wallet size={18} /> },
  { label: "Transactions", href: "/transactions", icon: <Receipt size={18} /> },
  { label: "Beneficiaries", href: "/beneficiaries", icon: <Users size={18} /> },
  "separator",
  { label: "Profile", href: "/profile", icon: <User size={18} /> },
  { label: "Notifications", href: "/notifications", icon: <Bell size={18} /> },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5"
          onClick={onNavigate}
        >
          <JWGlobe size={30} />
          <span className="font-bold text-base text-white tracking-tight">
            JW<span className="text-accent">Telecoms</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item, i) => {
          if (item === "separator") {
            return <div key={`sep-${i}`} className="my-2 border-t border-white/10" />;
          }

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150
                ${
                  isActive
                    ? "bg-accent/20 text-accent border border-accent/20"
                    : "text-gray-400 hover:bg-white/8 hover:text-white"
                }
              `}
            >
              <span className={isActive ? "text-accent" : "text-gray-500"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer links */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
        {/* Home link */}
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/8 hover:text-white transition-all"
        >
          <Home size={18} className="text-gray-500" />
          <span>Homepage</span>
        </Link>

        {/* Admin link — only visible for admin/super_admin */}
        {isAdmin && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-all border border-amber-500/10"
          >
            <Shield size={18} />
            <span>Admin Panel</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      {/* Desktop sidebar - fixed */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-navy border-r border-white/5">
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
              className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-navy lg:hidden shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
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
