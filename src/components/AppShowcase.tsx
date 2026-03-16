"use client";

import Link from "next/link";
import {
  motion, useScroll, useTransform, useInView,
  useMotionValue, animate, AnimatePresence,
} from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { ArrowRight, CheckCircle2, Zap, Phone, Wifi, Tv, GraduationCap, Package } from "lucide-react";
import { JWGlobe } from "@/components/ui/JWLogo";

const features = [
  "Instant 2-second delivery",
  "Best rates in Nigeria",
  "No hidden charges",
  "24/7 live support",
];

// abbr = initials shown in the circular provider badge
// color = brand background hex, light = whether text should be dark
const txnPool = [
  { label: "MTN 2GB Data",    amount: "₦500",   abbr: "M",  color: "#FFCC00", light: true  },
  { label: "Airtel Airtime",  amount: "₦200",   abbr: "A",  color: "#ED1C24", light: false },
  { label: "EKEDC Token",     amount: "₦3,000", abbr: "EK", color: "#1e40af", light: false },
  { label: "DStv Premium",    amount: "₦8,100", abbr: "DS", color: "#0033A0", light: false },
  { label: "Glo 5GB Data",    amount: "₦1,200", abbr: "G",  color: "#00A859", light: false },
  { label: "WAEC PIN",        amount: "₦3,500", abbr: "W",  color: "#003087", light: false },
  { label: "9mobile Airtime", amount: "₦500",   abbr: "9",  color: "#00B050", light: false },
  { label: "Ibadan Electric", amount: "₦5,000", abbr: "IB", color: "#1e40af", light: false },
];

type ToastPhase = "hidden" | "loading" | "done";

export default function AppShowcase() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.15 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const rotateX   = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [6, 0, 0, -6]);
  const rotateY   = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [-10, 0, 0, 10]);
  const translateY = useTransform(scrollYProgress, [0, 0.5, 1], [24, 0, -16]);

  // ── Shared feed + toast state ──────────────────────────────────────────
  const feedIdxRef    = useRef(0);
  const animRef       = useRef<{ stop: () => void } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [feedTxns, setFeedTxns] = useState([
    { ...txnPool[0], time: "Just now",  id: 10 },
    { ...txnPool[1], time: "1 min ago", id: 11 },
    { ...txnPool[2], time: "5 min ago", id: 12 },
  ]);
  const [toastTxn,  setToastTxn]  = useState(txnPool[0]);
  const [toastPhase, setToastPhase] = useState<ToastPhase>("hidden");
  const [cycleKey,   setCycleKey]   = useState(0);
  const [badgePulse, setBadgePulse] = useState(0);
  const toastProgress = useMotionValue(0);

  // Starts a toast cycle for a given transaction (cancels any in-flight anim)
  const startToast = useCallback((txn: typeof txnPool[0]) => {
    animRef.current?.stop();
    setToastTxn(txn);
    setToastPhase("loading");
    setCycleKey(k => k + 1);
    toastProgress.set(0);
    animRef.current = animate(toastProgress, 1, {
      duration: 2,
      ease: "linear",
      onComplete: () => setToastPhase("done"),
    });
  }, [toastProgress]);

  // Single interval drives both the live feed AND the toast
  useEffect(() => {
    if (!inView) return;

    // Kick off first toast immediately (no feed update needed — feed already shows 0,1,2)
    startToast(txnPool[feedIdxRef.current % txnPool.length]);

    const id = setInterval(() => {
      feedIdxRef.current += 1;
      const next = txnPool[feedIdxRef.current % txnPool.length];

      setFeedTxns(prev => [
        { ...next, time: "Just now", id: Date.now() },
        ...prev.slice(0, 2),
      ]);
      setBadgePulse(k => k + 1);

      // Delay toast so the feed item finishes spring-animating in first (~350ms)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => startToast(next), 350);
    }, 2500);

    return () => {
      clearInterval(id);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      animRef.current?.stop();
    };
  }, [inView, startToast]);

  const spring = { type: "spring" as const, damping: 22, stiffness: 180 };

  return (
    <section ref={sectionRef} className="py-14 sm:py-24 bg-[#f4f4f0] overflow-hidden">
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">

          {/* LEFT — Copy */}
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={spring}
              className="text-xs font-bold text-accent tracking-[0.18em] uppercase mb-3"
            >
              The App
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.08 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-[1.05] mb-5"
            >
              The fastest way
              <br />
              to recharge in Nigeria.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.14 }}
              className="text-muted leading-relaxed mb-7 max-w-md text-sm sm:text-base"
            >
              Buy airtime, data, pay electricity, subscribe to cable TV, and get
              exam pins — all in one place. No delays. No excuses.
            </motion.p>

            {/* Staggered feature bullets */}
            <ul className="space-y-2.5 mb-9">
              {features.map((f, i) => (
                <motion.li
                  key={f}
                  initial={{ opacity: 0, x: -16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ ...spring, delay: 0.2 + i * 0.09 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-navy/80 font-medium text-sm">{f}</span>
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.57 }}
            >
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-7 py-3.5 sm:px-8 sm:py-4 bg-navy text-white font-bold rounded-full hover:bg-navy-light transition-all hover:shadow-xl hover:shadow-navy/20 active:scale-[0.97] text-sm sm:text-base"
              >
                Start for Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* RIGHT — Phone mockup */}
          {/*
            On mobile (< lg): single column, phone centred.
            Floating badges use lg: for negative offsets — on mobile they
            stay inside the container so they don't bleed off-screen.
          */}
          <div className="relative flex justify-center lg:justify-end mt-2 lg:mt-0">

            {/* Scroll-linked 3D tilt */}
            <motion.div style={{ rotateX, rotateY, y: translateY }}>
              {/* D: Continuous float after entrance */}
              <motion.div
                animate={inView ? { y: [0, -10, 0] } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
              >
                {/* Phone frame */}
                <div className="relative w-[248px] sm:w-[272px] lg:w-[290px] h-[510px] sm:h-[560px] lg:h-[600px] rounded-[44px] bg-[#1a1a2e] border-[7px] border-[#0d0d1a] shadow-[0_50px_100px_-24px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#0d0d1a] rounded-full z-10" />

                  <div className="h-full bg-[#f4f4f0] flex flex-col overflow-hidden">
                    {/* App header */}
                    <div className="bg-gradient-to-r from-accent to-accent-dim px-4 pt-7 pb-4 flex-shrink-0">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <JWGlobe size={16} />
                          <span className="text-white text-[11px] font-bold">JWTelecoms</span>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                          <span className="text-[8px] text-white font-bold">AO</span>
                        </div>
                      </div>
                      <p className="text-white/60 text-[10px] mb-0.5">Available Balance</p>
                      <p className="text-white text-lg font-extrabold tracking-tight">₦12,450.00</p>
                    </div>

                    {/* Body */}
                    <div className="flex-1 p-3 overflow-hidden">
                      {/* Quick buy grid */}
                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        {[
                          { label: "Airtime", bg: "bg-amber-50",   iconBg: "bg-amber-400",   Icon: Phone,          fg: "text-white" },
                          { label: "Data",    bg: "bg-blue-50",    iconBg: "bg-blue-500",    Icon: Wifi,           fg: "text-white" },
                          { label: "Bills",   bg: "bg-emerald-50", iconBg: "bg-emerald-500", Icon: Zap,            fg: "text-white" },
                          { label: "Cable",   bg: "bg-purple-50",  iconBg: "bg-purple-500",  Icon: Tv,             fg: "text-white" },
                          { label: "Exams",   bg: "bg-rose-50",    iconBg: "bg-rose-500",    Icon: GraduationCap,  fg: "text-white" },
                          { label: "Bulk",    bg: "bg-slate-100",  iconBg: "bg-slate-500",   Icon: Package,        fg: "text-white" },
                        ].map(({ label, bg, iconBg, Icon, fg }) => (
                          <div key={label} className={`${bg} rounded-xl p-2 flex flex-col items-center`}>
                            <div className={`${iconBg} rounded-lg w-6 h-6 flex items-center justify-center mb-0.5`}>
                              <Icon className={`w-3 h-3 ${fg}`} />
                            </div>
                            <p className="text-[9px] font-semibold text-navy/70">{label}</p>
                          </div>
                        ))}
                      </div>

                      {/* A: Live transaction feed */}
                      <p className="text-[10px] font-bold text-navy/40 uppercase tracking-widest mb-1.5">Recent</p>
                      <div className="space-y-1.5 overflow-hidden">
                        <AnimatePresence mode="popLayout">
                          {feedTxns.map((t) => (
                            <motion.div
                              key={t.id}
                              layout
                              initial={{ opacity: 0, y: -22, scale: 0.93 }}
                              animate={{ opacity: 1, y: 0,   scale: 1    }}
                              exit={{    opacity: 0,          scale: 0.93 }}
                              transition={{ type: "spring", damping: 22, stiffness: 320 }}
                              className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-sm"
                            >
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[7px] font-black leading-none"
                                style={{ backgroundColor: t.color, color: t.light ? "#1a1a1a" : "#ffffff" }}
                              >
                                {t.abbr}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-semibold text-navy truncate">{t.label}</p>
                                <p className="text-[8px] text-muted">{t.time}</p>
                              </div>
                              <span className="text-[9px] font-bold text-emerald-600 flex-shrink-0">{t.amount}</span>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* B: Transaction toast — synced with live feed */}
            <AnimatePresence>
              {toastPhase !== "hidden" && (
                <motion.div
                  key={cycleKey}
                  initial={{ opacity: 0, y: 14, scale: 0.93 }}
                  animate={{ opacity: 1, y: 0,  scale: 1    }}
                  exit={{    opacity: 0, y: 8,  scale: 0.97 }}
                  transition={{ type: "spring", damping: 22, stiffness: 300 }}
                  // Mobile: left-2 stays in-bounds. lg: extends outside the column into the gap.
                  className="absolute bottom-14 left-2 lg:-left-8 bg-white rounded-2xl shadow-xl shadow-black/10 px-4 py-3 border border-border overflow-hidden w-48 sm:w-52"
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                      {/* Provider badge always visible as background */}
                      <div
                        className="absolute inset-0 rounded-xl"
                        style={{ backgroundColor: toastTxn.color }}
                      />
                      {toastPhase === "done" ? (
                        <motion.div
                          className="relative z-10"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", damping: 12, stiffness: 500 }}
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </motion.div>
                      ) : (
                        <span
                          className="relative z-10 text-[9px] font-black leading-none"
                          style={{ color: toastTxn.light ? "#1a1a1a" : "#ffffff" }}
                        >
                          {toastTxn.abbr}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-navy leading-tight truncate">
                        {toastPhase === "done" ? "Transaction Sent!" : "Processing..."}
                      </p>
                      {/* Synced: shows the actual current transaction */}
                      <p className="text-[10px] text-muted truncate">
                        {toastTxn.label} — 2s
                      </p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-[3px] bg-navy/6 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full w-full rounded-full bg-emerald-500 origin-left"
                      style={{ scaleX: toastProgress }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Speed badge — bounces on each new feed item */}
            <motion.div
              key={`badge-${badgePulse}`}
              initial={badgePulse === 0
                ? { opacity: 0, x: -16 }
                : { scale: 1.18 }
              }
              animate={{ scale: 1, opacity: 1, x: 0 }}
              transition={badgePulse === 0
                ? { ...spring, delay: 0.7 }
                : { type: "spring", damping: 10, stiffness: 360 }
              }
              // Mobile: right-2 stays in-bounds. lg: extends outside column.
              className="absolute top-12 right-2 lg:-right-8 bg-accent text-white rounded-2xl shadow-xl shadow-accent/25 px-3 py-2 text-center"
            >
              <p className="text-base font-extrabold leading-none">2s</p>
              <p className="text-[10px] font-medium opacity-80 mt-0.5">Avg speed</p>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
