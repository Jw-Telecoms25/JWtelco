"use client";

import { motion } from "framer-motion";
import { JWGlobe } from "@/components/ui/JWLogo";

const spring = { type: "spring" as const, damping: 22, stiffness: 180 };

// Will be updated with working long-format CDN URL once confirmed
const HERO_PHOTO = "https://images.unsplash.com/photo-1531123414780-f74242c2b052?w=1920&q=85&fit=crop&crop=faces,center";

export default function Hero() {
  return (
    <section className="relative h-[100svh] overflow-hidden">

      {/* Base gradient — shown when photo hasn't loaded */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0d1a] via-[#18053a] to-[#280060]" />

      {/* Lifestyle photo — full-bleed, no blend mode so colors show naturally */}
      {HERO_PHOTO && (
        <div
          className="absolute inset-0 bg-cover bg-[position:50%_30%] opacity-55"
          style={{ backgroundImage: `url(${HERO_PHOTO})` }}
        />
      )}

      {/* Scrim: strong bottom-left (for text), very light elsewhere */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/75 via-black/25 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {/* Purple glow accent */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#f4f4f0] to-transparent pointer-events-none" />

      {/* Content — absolutely anchored to bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-24 lg:pb-28 px-5 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col lg:flex-row items-end justify-between gap-6 lg:gap-8">

          {/* Headline — bottom-left */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-[88px] font-extrabold text-white leading-[0.95] tracking-[-0.03em]"
          >
            Recharge<br />
            Instantly.<br />
            <span className="text-accent">Save More.</span>
          </motion.h1>

          {/* Compact social-proof card — bottom-right, desktop only */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...spring, delay: 0.32 }}
            className="hidden lg:block flex-shrink-0"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-black/20 px-5 py-4 flex items-center gap-4">
              <JWGlobe size={36} />
              <div className="flex flex-col gap-2.5">
                <p className="text-xs font-bold text-navy/60 uppercase tracking-wider">JWTelecoms</p>
                <div className="flex items-center gap-4">
                  {[
                    { value: "50k+", label: "Users" },
                    { value: "₦2B+", label: "Processed" },
                    { value: "99.9%", label: "Uptime" },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="text-sm font-extrabold text-navy leading-none">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
