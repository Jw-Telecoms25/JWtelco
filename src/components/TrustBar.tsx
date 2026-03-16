"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const metrics = [
  { value: "50,000+", label: "Active Users" },
  { value: "₦2B+", label: "Processed" },
  { value: "99.9%", label: "Success Rate" },
  { value: "< 2 sec", label: "Avg Delivery" },
  { value: "24 / 7", label: "Live Support" },
];

const spring = { type: "spring" as const, damping: 24, stiffness: 180 };

export default function TrustBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className="relative bg-[#f4f4f0] overflow-hidden">
      {/* Desktop */}
      <div className="hidden sm:grid mx-auto max-w-7xl px-5 py-5 sm:grid-cols-5 divide-x divide-border">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring, delay: i * 0.08 }}
            className="flex flex-col items-center gap-0.5 px-4 py-3 text-center"
          >
            <span className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight">{m.value}</span>
            <span className="text-xs text-muted font-medium">{m.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Mobile: 2-col */}
      <div className="sm:hidden mx-auto max-w-7xl px-5 py-5 grid grid-cols-2 gap-3">
        {metrics.slice(0, 4).map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring, delay: i * 0.08 }}
            className="text-center p-3 rounded-2xl bg-white border border-border/50"
          >
            <span className="text-xl font-extrabold text-navy tracking-tight block">{m.value}</span>
            <span className="text-xs text-muted font-medium">{m.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
