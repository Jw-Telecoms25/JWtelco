"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, ChevronDown,
  Smartphone, Wifi, Zap, Tv, BookOpen, Users,
  MessageSquare, HelpCircle, UserPlus, LogIn,
} from "lucide-react";
import { JWGlobe } from "@/components/ui/JWLogo";

const serviceItems = [
  { label: "Airtime Topup",   href: "/buy/airtime",      icon: Smartphone, desc: "MTN, Glo, Airtel, 9mobile" },
  { label: "Data Bundles",    href: "/buy/data",          icon: Wifi,       desc: "SME from ₦100" },
  { label: "Electricity",     href: "/buy/electricity",   icon: Zap,        desc: "All 11 DISCOs" },
  { label: "Cable TV",        href: "/buy/cable",         icon: Tv,         desc: "DStv, GOtv, StarTimes" },
  { label: "Exam Pins",       href: "/buy/exam-pins",     icon: BookOpen,   desc: "WAEC, NECO, NABTEB" },
  { label: "Bulk Airtime",    href: "/buy/bulk-airtime",  icon: Users,      desc: "Up to 20 numbers" },
];

const supportItems = [
  { label: "Reviews", href: "#testimonials", icon: MessageSquare, desc: "What customers say" },
  { label: "FAQs",    href: "#faq",          icon: HelpCircle,    desc: "Common questions" },
];

const getStartedItems = [
  { label: "Create Account", href: "/register", icon: UserPlus, desc: "Sign up for free" },
  { label: "Log In",         href: "/login",    icon: LogIn,    desc: "Access your account" },
];

type MenuKey = "services" | "support" | "get-started" | null;

type DropdownItem = { label: string; href: string; icon: React.ElementType; desc: string };

function NavDropdown({
  items,
  wide = false,
  onMouseEnter,
  onMouseLeave,
  alignRight = false,
}: {
  items: DropdownItem[];
  wide?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  alignRight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`absolute top-full z-50 ${alignRight ? "right-0" : "left-0"} ${
        wide
          ? "mt-1 w-[400px] p-2 grid grid-cols-2 gap-0.5 bg-white rounded-2xl shadow-xl border border-border"
          : "mt-1 w-52 py-2 bg-white rounded-2xl shadow-xl border border-border"
      }`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#f4f4f0] transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-accent/8 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/15 transition-colors">
              <Icon className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-navy text-sm leading-tight">{item.label}</p>
              <p className="text-[11px] text-muted mt-0.5 leading-tight truncate">{item.desc}</p>
            </div>
          </Link>
        );
      })}
    </motion.div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  function openNav(key: MenuKey) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(key);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 130);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  const linkCls = (isScrolled: boolean) =>
    isScrolled
      ? "text-navy/60 hover:text-navy hover:bg-navy/5"
      : "text-white/70 hover:text-white hover:bg-white/10";

  const chevronCls = (key: MenuKey, isScrolled: boolean) =>
    `w-3.5 h-3.5 transition-transform ${openMenu === key ? "rotate-180" : ""} ${
      isScrolled ? "text-navy/40" : "text-white/40"
    }`;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#f4f4f0]/95 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <JWGlobe size={32} />
          <span
            className={`font-extrabold text-lg tracking-tight transition-colors ${
              scrolled ? "text-navy" : "text-white"
            }`}
          >
            JW<span className="text-accent">Telecoms</span>
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">

          {/* Services */}
          <div
            className="relative"
            onMouseEnter={() => openNav("services")}
            onMouseLeave={scheduleClose}
          >
            <button
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-full transition-all ${linkCls(scrolled)}`}
            >
              Services
              <ChevronDown className={chevronCls("services", scrolled)} />
            </button>
            <AnimatePresence>
              {openMenu === "services" && (
                <NavDropdown
                  items={serviceItems}
                  wide
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                />
              )}
            </AnimatePresence>
          </div>

          <a
            href="#how-it-works"
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${linkCls(scrolled)}`}
          >
            How It Works
          </a>

          <a
            href="#pricing"
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${linkCls(scrolled)}`}
          >
            Pricing
          </a>

          {/* Support */}
          <div
            className="relative"
            onMouseEnter={() => openNav("support")}
            onMouseLeave={scheduleClose}
          >
            <button
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-full transition-all ${linkCls(scrolled)}`}
            >
              Support
              <ChevronDown className={chevronCls("support", scrolled)} />
            </button>
            <AnimatePresence>
              {openMenu === "support" && (
                <NavDropdown
                  items={supportItems}
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {/* Get Started dropdown */}
          <div
            className="relative"
            onMouseEnter={() => openNav("get-started")}
            onMouseLeave={scheduleClose}
          >
            <button
              className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-bold text-white bg-accent rounded-full hover:bg-accent-bright transition-all hover:shadow-lg hover:shadow-accent/30 active:scale-[0.97]"
            >
              Get Started
              <ChevronDown className={`w-3.5 h-3.5 transition-transform text-white/70 ${openMenu === "get-started" ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {openMenu === "get-started" && (
                <NavDropdown
                  items={getStartedItems}
                  alignRight
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden p-2 rounded-full transition-colors ${
            scrolled ? "text-navy hover:bg-navy/5" : "text-white hover:bg-white/10"
          }`}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#f4f4f0]/98 backdrop-blur-xl border-t border-border overflow-hidden"
          >
            <div className="px-5 py-4 flex flex-col gap-1">
              <p className="px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                Services
              </p>
              {serviceItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-navy/70 hover:text-navy hover:bg-navy/5 rounded-2xl transition-all"
                  >
                    <Icon className="w-4 h-4 text-accent flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="mt-1 pt-1 border-t border-border">
                <p className="px-4 py-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                  More
                </p>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm font-medium text-navy/70 hover:text-navy hover:bg-navy/5 rounded-2xl transition-all"
                >
                  How It Works
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm font-medium text-navy/70 hover:text-navy hover:bg-navy/5 rounded-2xl transition-all"
                >
                  Pricing
                </a>
                {supportItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-navy/70 hover:text-navy hover:bg-navy/5 rounded-2xl transition-all"
                    >
                      <Icon className="w-4 h-4 text-accent flex-shrink-0" />
                      {item.label}
                    </a>
                  );
                })}
              </div>

              <div className="mt-2 pt-3 border-t border-border flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-semibold text-center text-navy/70 rounded-2xl hover:bg-navy/5 transition-all"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-bold text-center text-white bg-accent rounded-full hover:bg-accent-bright transition-all"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
