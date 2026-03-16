"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, Wallet, Zap } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Create Account",
    description: "Sign up in 30 seconds. Just your email and phone. No KYC, no paperwork. Instant access.",
    iconColor: "text-white",
    iconBg: "bg-accent shadow-lg shadow-accent/30",
    numColor: "text-accent",
    cardBg: "bg-gradient-to-br from-accent/5 to-accent/[0.02]",
    border: "border-accent/20",
    glow: "shadow-accent/10",
  },
  {
    step: "02",
    icon: Wallet,
    title: "Fund Your Wallet",
    description: "Add money via bank transfer, card, or USSD. Funds reflect in seconds. No delays.",
    iconColor: "text-white",
    iconBg: "bg-emerald-500 shadow-lg shadow-emerald-500/30",
    numColor: "text-emerald-500",
    cardBg: "bg-gradient-to-br from-emerald-500/5 to-emerald-500/[0.02]",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
  },
  {
    step: "03",
    icon: Zap,
    title: "Buy & Relax",
    description: "Airtime, data, bills — all delivered in under 2 seconds. Set and forget.",
    iconColor: "text-white",
    iconBg: "bg-amber-500 shadow-lg shadow-amber-500/30",
    numColor: "text-amber-500",
    cardBg: "bg-gradient-to-br from-amber-500/5 to-amber-500/[0.02]",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/10",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-white">
      <div className="relative z-10 mx-auto max-w-7xl px-5" ref={ref}>

        {/* Header */}
        <div className="max-w-2xl mb-14 sm:mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4 }}
            className="text-xs font-bold text-accent tracking-[0.18em] uppercase mb-3"
          >
            How It Works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-[1.1]"
          >
            Three steps.{" "}
            <span className="text-navy/25">Zero stress.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="mt-4 text-muted leading-relaxed max-w-md"
          >
            We designed JWTelecoms to be the simplest VTU platform in Nigeria.
            No complications, no confusion.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.14 }}
                className="relative group"
              >
                <div
                  className={`relative p-7 sm:p-8 rounded-3xl ${step.cardBg} border ${step.border} hover:shadow-xl ${step.glow} transition-all duration-400 overflow-hidden`}
                >
                  {/* Subtle top accent line */}
                  <div className={`absolute top-0 left-8 right-8 h-px ${step.border.replace("border-", "bg-").replace("/20", "/40")}`} />

                  <div className="flex items-start justify-between mb-6">
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={inView ? { scale: 1, opacity: 1 } : {}}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.22 + i * 0.14 }}
                      className={`w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center`}
                    >
                      <Icon className={`w-7 h-7 ${step.iconColor}`} />
                    </motion.div>

                    {/* Step number */}
                    <span className={`text-5xl font-black ${step.numColor} opacity-25 leading-none`}>
                      {step.step}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-navy mb-2.5">{step.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
