"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, TrendingUp } from "lucide-react";

const stats = [
  { value: "50K+", label: "Active Users" },
  { value: "99.9%", label: "Success Rate" },
  { value: "2s", label: "Avg. Delivery" },
  { value: "24/7", label: "Support" },
];

const badges = [
  { icon: Shield, text: "Bank-grade Security" },
  { icon: Clock, text: "Instant Delivery" },
  { icon: TrendingUp, text: "Best Rates" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-navy noise-bg" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-dim/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
              <span className="text-sm text-white/70 font-medium">
                Trusted by 50,000+ Nigerians
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight"
            >
              Recharge{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-accent-bright">Instantly.</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="absolute bottom-2 left-0 right-0 h-3 bg-accent/20 -z-0 origin-left"
                />
              </span>
              <br />
              Save More.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6 text-lg text-white/50 max-w-lg leading-relaxed"
            >
              Buy airtime, data bundles, pay electricity bills, and more — all
              from one platform. Lightning fast, ridiculously affordable.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-7 py-4 bg-accent text-navy font-bold rounded-2xl hover:bg-accent-bright transition-all hover:shadow-xl hover:shadow-accent/20 active:scale-[0.98]"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#services"
                className="inline-flex items-center gap-2 px-7 py-4 text-white/70 font-semibold rounded-2xl border border-white/10 hover:border-white/20 hover:text-white transition-all"
              >
                View Services
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-10 flex flex-wrap gap-6"
            >
              {badges.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/40">
                  <Icon className="w-4 h-4 text-accent/60" />
                  <span className="text-sm font-medium">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Stats card cluster */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:block relative"
          >
            {/* Main card */}
            <div className="relative bg-white/[0.07] backdrop-blur-xl rounded-3xl border border-white/10 p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-[60px]" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Platform Stats</p>
                    <p className="text-sm text-white/40">Live overview</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/5"
                    >
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-white/40 mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Simulated activity feed */}
                <div className="mt-6 space-y-3">
                  {[
                    { name: "Amina O.", action: "bought 2GB MTN data", time: "2s ago" },
                    { name: "Chidi E.", action: "recharged ₦1,000 airtime", time: "5s ago" },
                    { name: "Blessing A.", action: "paid electricity bill", time: "12s ago" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 1 + i * 0.2 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                        {item.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/70 truncate">
                          <span className="text-white font-medium">{item.name}</span>{" "}
                          {item.action}
                        </p>
                      </div>
                      <span className="text-xs text-white/30 flex-shrink-0">{item.time}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-2xl shadow-black/10 px-5 py-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy">SSL Secured</p>
                <p className="text-xs text-muted">256-bit encryption</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
