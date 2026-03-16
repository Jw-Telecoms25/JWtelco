"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Check } from "lucide-react";

const networks = ["MTN", "Airtel", "Glo", "9mobile"];
const networkColors: Record<string, string> = {
  MTN: "bg-yellow-400 text-black",
  Airtel: "bg-red-500 text-white",
  Glo: "bg-green-500 text-white",
  "9mobile": "bg-green-700 text-white",
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

export default function Pricing() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [activeNetwork, setActiveNetwork] = useState("MTN");

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-surface-elevated relative">
      <div className="mx-auto max-w-7xl px-6" ref={ref}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              className="text-sm font-semibold text-accent tracking-wide uppercase mb-3"
            >
              Pricing
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight"
            >
              Transparent rates.
              <br />
              <span className="text-muted">No hidden fees.</span>
            </motion.h2>
          </div>

          {/* Network tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="flex gap-2 p-1.5 bg-white rounded-xl border border-border"
          >
            {networks.map((net) => (
              <button
                key={net}
                onClick={() => setActiveNetwork(net)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  activeNetwork === net
                    ? `${networkColors[net]} shadow-sm`
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
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-border overflow-hidden"
        >
          {/* Table header */}
          <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-navy/[0.02] border-b border-border">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Plan</span>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Price</span>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Validity</span>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider text-right">Action</span>
          </div>

          {/* Table rows */}
          {plans[activeNetwork].map((plan, i) => (
            <motion.div
              key={`${activeNetwork}-${plan.data}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-4 gap-4 px-6 py-4 items-center border-b border-border/50 last:border-0 hover:bg-navy/[0.01] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${networkColors[activeNetwork].split(" ")[0]}`} />
                <span className="font-bold text-navy">{plan.data}</span>
              </div>
              <span className="font-semibold text-navy">{plan.price}</span>
              <div className="flex items-center gap-1.5 text-sm text-muted">
                <Check className="w-3.5 h-3.5 text-emerald" />
                {plan.validity}
              </div>
              <div className="text-right">
                <button className="px-4 py-2 text-xs font-bold text-accent-dim bg-accent/10 hover:bg-accent hover:text-white rounded-lg transition-all">
                  Buy Now
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <p className="text-center text-sm text-muted mt-6">
          Prices may vary. Login for real-time rates. Bulk/reseller discounts available.
        </p>
      </div>
    </section>
  );
}
