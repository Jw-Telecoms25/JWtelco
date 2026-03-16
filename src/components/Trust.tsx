"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Clock, Headphones, BadgeCheck, Lock, Users } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "2-Second Delivery",
    description: "Most transactions complete before you can blink. Automated, instant, always.",
    color: "text-white",
    bg: "bg-amber-500 shadow-md shadow-amber-500/30",
    border: "border-amber-500/20",
    glow: "group-hover:shadow-amber-500/15",
  },
  {
    icon: Shield,
    title: "100% Secure",
    description: "SSL encryption on every transaction. Bank-grade security protecting your money.",
    color: "text-white",
    bg: "bg-accent shadow-md shadow-accent/30",
    border: "border-accent/20",
    glow: "group-hover:shadow-accent/15",
  },
  {
    icon: BadgeCheck,
    title: "Verified Platform",
    description: "Registered Nigerian business with thousands of verified 5-star reviews.",
    color: "text-white",
    bg: "bg-emerald-500 shadow-md shadow-emerald-500/30",
    border: "border-emerald-500/20",
    glow: "group-hover:shadow-emerald-500/15",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Real humans ready to help anytime. WhatsApp, phone, or live chat — your choice.",
    color: "text-white",
    bg: "bg-blue-500 shadow-md shadow-blue-500/30",
    border: "border-blue-500/20",
    glow: "group-hover:shadow-blue-500/15",
  },
  {
    icon: Lock,
    title: "Money-Back Guarantee",
    description: "Failed transaction? Get an instant refund. No stories, no delays, no excuses.",
    color: "text-white",
    bg: "bg-rose-500 shadow-md shadow-rose-500/30",
    border: "border-rose-500/20",
    glow: "group-hover:shadow-rose-500/15",
  },
  {
    icon: Users,
    title: "Reseller Friendly",
    description: "Special pricing for bulk buyers. Start your own VTU business with our platform.",
    color: "text-white",
    bg: "bg-teal-600 shadow-md shadow-teal-600/30",
    border: "border-teal-500/20",
    glow: "group-hover:shadow-teal-500/15",
  },
];

const spring = { type: "spring" as const, damping: 24, stiffness: 180 };

export default function Trust() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.08 });

  return (
    <section className="pt-8 pb-16 sm:pb-24 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-5" ref={ref}>

        {/* Safety Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={spring}
          className="relative bg-[#f4f4f0] rounded-3xl px-8 py-10 sm:py-14 text-center mb-6 overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[180px] bg-accent/8 rounded-full blur-[70px]" />

          {/* Shield icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ ...spring, delay: 0.15 }}
            className="relative z-10 w-16 h-16 mx-auto mb-5 rounded-2xl bg-white border border-accent/15 shadow-lg shadow-accent/10 flex items-center justify-center"
          >
            <Shield className="w-8 h-8 text-accent" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ ...spring, delay: 0.08 }}
            className="text-xs font-bold text-accent tracking-[0.18em] uppercase mb-3"
          >
            Why JWTelecoms
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring, delay: 0.2 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-[1.1] mb-4 relative z-10"
          >
            Security is a priority.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ ...spring, delay: 0.28 }}
            className="text-muted leading-relaxed max-w-md mx-auto relative z-10"
          >
            We built JWTelecoms so that when you need to recharge, it happens now.
            Not in 5 minutes. Not &ldquo;processing.&rdquo; <strong className="text-navy">Now.</strong>
          </motion.p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ ...spring, delay: 0.18 + i * 0.07 }}
                className={`group p-6 rounded-3xl border ${f.border} bg-white hover:shadow-xl ${f.glow} transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="font-extrabold text-navy mb-2">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
