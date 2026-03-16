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
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={17} /> },
  { label: "Buy Airtime", href: "/buy/airtime", icon: <Phone size={17} /> },
  { label: "Buy Data", href: "/buy/data", icon: <Wifi size={17} /> },
  { label: "Electricity", href: "/buy/electricity", icon: <Zap size={17} /> },
  { label: "Cable TV", href: "/buy/cable", icon: <Tv size={17} /> },
  { label: "Exam Pins", href: "/buy/exam-pins", icon: <GraduationCap size={17} /> },
  { label: "Bulk Airtime", href: "/buy/bulk-airtime", icon: <Layers size={17} /> },
  "separator",
  { label: "Wallet", href: "/wallet", icon: <Wallet size={17} /> },
  { label: "Transactions", href: "/transactions", icon: <Receipt size={17} /> },
  { label: "Beneficiaries", href: "/beneficiaries", icon: <Users size={17} /> },
  "separator",
  { label: "Profile", href: "/profile", icon: <User size={17} /> },
  { label: "Notifications", href: "/notifications", icon: <Bell size={17} /> },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5"
          onClick={onNavigate}
        >
          <JWGlobe size={28} />
          <span className="font-extrabold text-base text-navy tracking-tight">
            JW<span className="text-accent">Telecoms</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item, i) => {
          if (item === "separator") {
            return <div key={`sep-${i}`} className="my-2 border-t border-border" />;
          }

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium
                transition-all duration-150
                ${
                  isActive
                    ? "bg-accent/8 text-accent border border-accent/12"
                    : "text-navy/50 hover:bg-navy/4 hover:text-navy"
                }
              `}
            >
              <span className={isActive ? "text-accent" : "text-navy/35"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer links */}
      <div className="px-3 pb-4 space-y-1 border-t border-border pt-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-navy/40 hover:bg-navy/4 hover:text-navy transition-all"
        >
          <Home size={17} className="text-navy/30" />
          <span>Homepage</span>
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all border border-amber-200/60"
          >
            <Shield size={17} />
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-white border-r border-border shadow-sm">
        <NavContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white lg:hidden shadow-2xl border-r border-border"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-navy/40 hover:text-navy hover:bg-navy/5 transition-colors z-10"
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
