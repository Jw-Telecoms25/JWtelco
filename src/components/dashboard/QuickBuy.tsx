"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Wifi, Zap, Tv, GraduationCap, Layers } from "lucide-react";

const services = [
  {
    label: "Airtime",
    href: "/buy/airtime",
    icon: Phone,
    bg: "bg-amber-50",
    fg: "text-amber-600",
    border: "border-amber-100 hover:border-amber-300",
    iconBg: "bg-amber-100",
  },
  {
    label: "Data",
    href: "/buy/data",
    icon: Wifi,
    bg: "bg-blue-50",
    fg: "text-blue-600",
    border: "border-blue-100 hover:border-blue-300",
    iconBg: "bg-blue-100",
  },
  {
    label: "Electricity",
    href: "/buy/electricity",
    icon: Zap,
    bg: "bg-emerald-50",
    fg: "text-emerald-600",
    border: "border-emerald-100 hover:border-emerald-300",
    iconBg: "bg-emerald-100",
  },
  {
    label: "Cable TV",
    href: "/buy/cable",
    icon: Tv,
    bg: "bg-purple-50",
    fg: "text-accent",
    border: "border-accent/10 hover:border-accent/30",
    iconBg: "bg-accent/8",
  },
  {
    label: "Exam Pins",
    href: "/buy/exam-pins",
    icon: GraduationCap,
    bg: "bg-rose-50",
    fg: "text-rose-600",
    border: "border-rose-100 hover:border-rose-300",
    iconBg: "bg-rose-100",
  },
  {
    label: "Bulk",
    href: "/buy/bulk-airtime",
    icon: Layers,
    bg: "bg-slate-50",
    fg: "text-slate-600",
    border: "border-slate-100 hover:border-slate-300",
    iconBg: "bg-slate-100",
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
      <h2 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">
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
              className={`group flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white border transition-all duration-200 text-center hover:shadow-md active:scale-[0.96] ${s.border}`}
            >
              <div className={`p-2.5 rounded-xl ${s.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                <s.icon size={18} className={s.fg} />
              </div>
              <span className={`text-xs font-semibold ${s.fg}`}>
                {s.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
