"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Clock, Headphones, BadgeCheck, Lock, Users } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "2-Second Delivery",
    description: "Most transactions complete before you can blink. Our automated system processes orders instantly.",
  },
  {
    icon: Shield,
    title: "100% Secure",
    description: "SSL encryption on every transaction. Your data and money are protected with bank-grade security.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Platform",
    description: "Registered Nigerian business with thousands of verified reviews. We're here to stay.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Real humans ready to help anytime. Reach us via WhatsApp, phone, or live chat.",
  },
  {
    icon: Lock,
    title: "Money-Back Guarantee",
    description: "Failed transaction? Get an instant refund. No stories, no delays. Your money is safe.",
  },
  {
    icon: Users,
    title: "Reseller Friendly",
    description: "Special pricing for resellers and bulk buyers. Start your own VTU business with us.",
  },
];

export default function Trust() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6" ref={ref}>
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-16 items-start">
          {/* Left — sticky heading */}
          <div className="lg:sticky lg:top-32">
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              className="text-sm font-semibold text-accent tracking-wide uppercase mb-3"
            >
              Why JWTelecoms
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl font-bold text-navy tracking-tight mb-6"
            >
              Built for reliability.
              <br />
              <span className="text-muted">Loved for simplicity.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="text-muted leading-relaxed"
            >
              We understand that when you need to recharge, you need it now. Not
              in 5 minutes. Not &quot;processing.&quot; Now. That&apos;s why we built
              JWTelecoms to be the fastest, most reliable VTU platform in
              Nigeria.
            </motion.p>
          </div>

          {/* Right — feature grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="p-6 rounded-2xl bg-white border border-border hover:border-accent/20 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-navy/5 group-hover:bg-accent/10 flex items-center justify-center mb-4 transition-colors">
                  <f.icon className="w-5 h-5 text-navy/60 group-hover:text-accent transition-colors" />
                </div>
                <h3 className="font-bold text-navy mb-2">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
