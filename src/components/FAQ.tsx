"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How fast is the delivery?",
    a: "Most transactions are completed within 2–5 seconds. Airtime and data are delivered almost instantly. Bill payments like electricity tokens may take up to 30 seconds during peak hours.",
  },
  {
    q: "Is my money safe on JWTelecoms?",
    a: "Absolutely. We use SSL encryption and bank-grade security for all transactions. Your wallet funds are protected and we offer instant refunds for any failed transaction. No stories.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept bank transfers (all Nigerian banks), card payments (Visa/Mastercard), USSD payments, and wallet-to-wallet transfers. Funds are credited to your wallet instantly.",
  },
  {
    q: "Can I become a reseller?",
    a: "Yes! We offer special reseller pricing with bulk discounts. You can start your own VTU business using our platform. Contact our support team for reseller account setup.",
  },
  {
    q: "What if a transaction fails?",
    a: "Failed transactions are automatically reversed to your wallet within seconds. If it doesn't reverse automatically, contact our 24/7 support and we'll resolve it immediately.",
  },
  {
    q: "Do you support all Nigerian networks?",
    a: "Yes — MTN, Airtel, Glo, and 9mobile. We also support all electricity distribution companies (EKEDC, IKEDC, AEDC, etc.), DStv, GOtv, StarTimes, and educational services.",
  },
  {
    q: "Is there a minimum amount I can buy?",
    a: "No minimum for airtime (start from ₦50). Data bundles start from ₦100. Fund your wallet with any amount — there's no minimum deposit either.",
  },
  {
    q: "How do I contact support?",
    a: "You can reach us 24/7 via WhatsApp, phone call, or the live chat on our platform. Average response time is under 2 minutes.",
  },
];

function FAQItem({ faq, index }: { faq: { q: string; a: string }; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-border last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="font-semibold text-navy group-hover:text-accent-dim transition-colors">
          {faq.q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-muted" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-muted leading-relaxed pr-12">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="faq" className="py-24 sm:py-32 relative">
      <div className="mx-auto max-w-7xl px-6" ref={ref}>
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-16">
          {/* Left */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              className="text-sm font-semibold text-accent tracking-wide uppercase mb-3"
            >
              FAQ
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl font-bold text-navy tracking-tight mb-6"
            >
              Got questions?
              <br />
              <span className="text-muted">We&apos;ve got answers.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2 }}
              className="text-muted leading-relaxed mb-6"
            >
              Can&apos;t find what you&apos;re looking for? Chat with our support team
              — we&apos;re online 24/7.
            </motion.p>
            <motion.a
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 }}
              href="#"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-navy rounded-xl hover:bg-navy-light transition-all"
            >
              Chat with Support
            </motion.a>
          </div>

          {/* Right */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-border p-6 sm:p-8"
          >
            {faqs.map((faq, i) => (
              <FAQItem key={i} faq={faq} index={i} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
