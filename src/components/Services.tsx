"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Smartphone,
  Wifi,
  Zap,
  GraduationCap,
  FileText,
  CreditCard,
} from "lucide-react";

const services = [
  {
    icon: Smartphone,
    title: "Airtime Topup",
    description: "Instant airtime for MTN, Glo, Airtel, and 9mobile. Any amount, any time.",
    color: "bg-amber-50 text-amber-600",
    accent: "group-hover:bg-amber-500",
  },
  {
    icon: Wifi,
    title: "Data Bundles",
    description: "Cheap data plans starting from ₦100. SME and gifting data available.",
    color: "bg-blue-50 text-blue-600",
    accent: "group-hover:bg-blue-500",
  },
  {
    icon: Zap,
    title: "Electricity Bills",
    description: "Pay PHCN, EKEDC, IKEDC and all disco bills. Get token instantly.",
    color: "bg-emerald-50 text-emerald-600",
    accent: "group-hover:bg-emerald-500",
  },
  {
    icon: CreditCard,
    title: "Cable TV",
    description: "Subscribe to DStv, GOtv, and StarTimes packages at discounted rates.",
    color: "bg-purple-50 text-purple-600",
    accent: "group-hover:bg-purple-500",
  },
  {
    icon: GraduationCap,
    title: "Education",
    description: "WAEC, NECO, and NABTEB result checker PINs. Exam registration made easy.",
    color: "bg-rose-50 text-rose-600",
    accent: "group-hover:bg-rose-500",
  },
  {
    icon: FileText,
    title: "NIN & CAC Services",
    description: "NIN slip printing, CAC business registration and verification services.",
    color: "bg-cyan-50 text-cyan-600",
    accent: "group-hover:bg-cyan-500",
  },
];

export default function Services() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="services" className="py-16 sm:py-24 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div ref={ref} className="max-w-2xl mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="text-sm font-semibold text-accent tracking-wide uppercase mb-3"
          >
            What We Offer
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight"
          >
            Everything you need,
            <br />
            <span className="text-muted">one platform.</span>
          </motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="group relative p-6 sm:p-8 rounded-2xl bg-white border border-border hover:border-transparent hover:shadow-xl hover:shadow-black/5 transition-all duration-300 cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110`}
              >
                <service.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-navy mb-2 group-hover:text-accent-dim transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {service.description}
              </p>
              <div className={`absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-transparent ${service.accent} transition-all duration-300 group-hover:h-1`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
