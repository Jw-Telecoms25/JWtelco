"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Wifi, Zap, Tv, GraduationCap, Layers } from "lucide-react";

const services = [
  {
    label: "Airtime",
    href: "/buy/airtime",
    icon: Phone,
    bg: "bg-blue-500/10",
    fg: "text-blue-400",
    border: "border-blue-500/20",
    glow: "group-hover:shadow-blue-500/20",
  },
  {
    label: "Data",
    href: "/buy/data",
    icon: Wifi,
    bg: "bg-purple-500/10",
    fg: "text-purple-400",
    border: "border-purple-500/20",
    glow: "group-hover:shadow-purple-500/20",
  },
  {
    label: "Electricity",
    href: "/buy/electricity",
    icon: Zap,
    bg: "bg-amber-500/10",
    fg: "text-amber-400",
    border: "border-amber-500/20",
    glow: "group-hover:shadow-amber-500/20",
  },
  {
    label: "Cable TV",
    href: "/buy/cable",
    icon: Tv,
    bg: "bg-emerald-500/10",
    fg: "text-emerald-400",
    border: "border-emerald-500/20",
    glow: "group-hover:shadow-emerald-500/20",
  },
  {
    label: "Exam Pins",
    href: "/buy/exam-pins",
    icon: GraduationCap,
    bg: "bg-rose-500/10",
    fg: "text-rose-400",
    border: "border-rose-500/20",
    glow: "group-hover:shadow-rose-500/20",
  },
  {
    label: "Bulk",
    href: "/buy/bulk-airtime",
    icon: Layers,
    bg: "bg-cyan-500/10",
    fg: "text-cyan-400",
    border: "border-cyan-500/20",
    glow: "group-hover:shadow-cyan-500/20",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function QuickBuy() {
  return (
    <div>
      <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">
        Quick Buy
      </h2>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 sm:grid-cols-6 gap-2.5"
      >
        {services.map((s) => (
          <motion.div key={s.href} variants={item}>
            <Link
              href={s.href}
              className={`group flex flex-col items-center gap-2.5 p-4 rounded-2xl border bg-surface hover:shadow-lg transition-all duration-200 text-center active:scale-[0.96] ${s.border}`}
            >
              <div
                className={`p-2.5 rounded-xl ${s.bg} group-hover:scale-110 transition-transform duration-200`}
              >
                <s.icon size={20} className={s.fg} />
              </div>
              <span className="text-xs font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                {s.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
