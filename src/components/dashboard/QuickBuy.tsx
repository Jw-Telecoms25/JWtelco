"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Wifi, Zap, Tv, GraduationCap } from "lucide-react";

const services = [
  {
    label: "Airtime",
    href: "/buy/airtime",
    icon: Phone,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Data",
    href: "/buy/data",
    icon: Wifi,
    color: "bg-purple-50 text-purple-600",
  },
  {
    label: "Electricity",
    href: "/buy/electricity",
    icon: Zap,
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "Cable TV",
    href: "/buy/cable",
    icon: Tv,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Exam Pins",
    href: "/buy/exam-pins",
    icon: GraduationCap,
    color: "bg-rose-50 text-rose-600",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function QuickBuy() {
  return (
    <div>
      <h2 className="text-sm font-medium text-muted mb-3">Quick Access</h2>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 sm:grid-cols-5 gap-3"
      >
        {services.map((s) => (
          <motion.div key={s.href} variants={item}>
            <Link
              href={s.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-surface hover:bg-surface-elevated hover:shadow-sm transition-all text-center"
            >
              <div className={`p-2.5 rounded-xl ${s.color}`}>
                <s.icon size={22} />
              </div>
              <span className="text-xs font-medium text-foreground">
                {s.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
