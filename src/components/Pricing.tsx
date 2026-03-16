"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const networks = ["MTN", "Airtel", "Glo", "9mobile"];

const networkConfig: Record<string, { color: string; active: string; dot: string }> = {
  MTN: { color: "bg-yellow-400 text-black", active: "border-yellow-400 bg-yellow-50", dot: "bg-yellow-400" },
  Airtel: { color: "bg-red-500 text-white", active: "border-red-400 bg-red-50", dot: "bg-red-500" },
  Glo: { color: "bg-green-500 text-white", active: "border-green-400 bg-green-50", dot: "bg-green-500" },
  "9mobile": { color: "bg-teal-600 text-white", active: "border-teal-400 bg-teal-50", dot: "bg-teal-600" },
};

const plans: Record<string, { data: string; price: string; validity: string }[]> = {
  MTN: [
    { data: "500MB", price: "₦130", validity: "30 days" },
    { data: "1GB", price: "₦250", validity: "30 days" },
    { data: "2GB", price: "₦500", validity: "30 days" },
    { data: "3GB", price: "₦750", validity: "30 days" },
    { data: "5GB", price: "₦1,250", validity: "30 days" },
    { data: "10GB", price: "₦2,500", validity: "30 days" },
  ],
  Airtel: [
    { data: "500MB", price: "₦130", validity: "30 days" },
    { data: "1GB", price: "₦250", validity: "30 days" },
    { data: "2GB", price: "₦500", validity: "30 days" },
    { data: "3GB", price: "₦750", validity: "30 days" },
    { data: "5GB", price: "₦1,250", validity: "30 days" },
    { data: "10GB", price: "₦2,500", validity: "30 days" },
  ],
  Glo: [
    { data: "500MB", price: "₦120", validity: "30 days" },
    { data: "1GB", price: "₦230", validity: "30 days" },
    { data: "2GB", price: "₦460", validity: "30 days" },
    { data: "3GB", price: "₦690", validity: "30 days" },
    { data: "5GB", price: "₦1,150", validity: "30 days" },
    { data: "10GB", price: "₦2,300", validity: "30 days" },
  ],
  "9mobile": [
    { data: "500MB", price: "₦120", validity: "30 days" },
    { data: "1GB", price: "₦230", validity: "30 days" },
    { data: "2GB", price: "₦460", validity: "30 days" },
    { data: "3GB", price: "₦690", validity: "30 days" },
    { data: "5GB", price: "₦1,150", validity: "30 days" },
    { data: "10GB", price: "₦2,300", validity: "30 days" },
  ],
};

const spring = { type: "spring" as const, damping: 24, stiffness: 180 };

export default function Pricing() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const [activeNetwork, setActiveNetwork] = useState("MTN");
  const config = networkConfig[activeNetwork];

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-[#f4f4f0]">
      <div className="mx-auto max-w-7xl px-5" ref={ref}>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={spring}
              className="text-xs font-bold text-accent tracking-[0.18em] uppercase mb-3"
            >
              Pricing
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.08 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-[1.1]"
            >
              Transparent rates.
              <br />
              <span className="text-navy/25">No hidden fees.</span>
            </motion.h2>
          </div>

          {/* Network tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring, delay: 0.18 }}
            className="flex gap-2 p-1.5 bg-white rounded-2xl border border-border shadow-sm"
          >
            {networks.map((net) => (
              <button
                key={net}
                onClick={() => setActiveNetwork(net)}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                  activeNetwork === net
                    ? `${networkConfig[net].color} shadow-sm`
                    : "text-muted hover:text-navy"
                }`}
              >
                {net}
              </button>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring, delay: 0.25 }}
          className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm"
        >
          {/* Table header */}
          <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-[#f4f4f0] border-b border-border">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Plan</span>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Price</span>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Validity</span>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider text-right">Action</span>
          </div>

          {plans[activeNetwork].map((plan, i) => (
            <motion.div
              key={`${activeNetwork}-${plan.data}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="grid grid-cols-4 gap-4 px-6 py-4 items-center border-b border-border/50 last:border-0 hover:bg-[#fafafa] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                <span className="font-extrabold text-navy">{plan.data}</span>
              </div>
              <span className="font-bold text-navy">{plan.price}</span>
              <div className="flex items-center gap-1.5 text-sm text-muted">
                <Check className="w-3.5 h-3.5 text-emerald" />
                {plan.validity}
              </div>
              <div className="text-right">
                <Link
                  href="/buy/data"
                  className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-accent bg-accent/8 hover:bg-accent hover:text-white rounded-full transition-all"
                >
                  Buy
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <p className="text-center text-sm text-muted mt-6">
          Login for real-time rates. Bulk and reseller discounts available.
        </p>
      </div>
    </section>
  );
}
