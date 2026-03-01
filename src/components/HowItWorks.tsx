"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, Wallet, ShoppingBag } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Create Account",
    description: "Sign up in 30 seconds. No paperwork, no KYC hassle. Just your email and phone number.",
  },
  {
    step: "02",
    icon: Wallet,
    title: "Fund Your Wallet",
    description: "Add money via bank transfer, USSD, or card payment. Funds reflect instantly.",
  },
  {
    step: "03",
    icon: ShoppingBag,
    title: "Start Purchasing",
    description: "Buy airtime, data, pay bills — all delivered to you within seconds. That's it.",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-navy relative overflow-hidden noise-bg">
      <div className="absolute top-0 left-1/2 w-[800px] h-[400px] bg-accent/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />

      <div className="relative z-10 mx-auto max-w-7xl px-6" ref={ref}>
        <div className="text-center max-w-2xl mx-auto mb-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="text-sm font-semibold text-accent tracking-wide uppercase mb-3"
          >
            How It Works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight"
          >
            Three steps.
            <br />
            <span className="text-white/40">Zero stress.</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0" />

          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="relative text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.07] border border-white/10 mb-6 relative">
                <step.icon className="w-7 h-7 text-accent" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-lg bg-accent text-navy text-xs font-bold flex items-center justify-center">
                  {step.step}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
