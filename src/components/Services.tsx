"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const services = [
  {
    title: "Airtime Topup",
    subtitle: "MTN • Glo • Airtel • 9mobile",
    href: "/buy/airtime",
    gradient: "from-amber-500 via-orange-500 to-red-600",
    photo: "https://images.unsplash.com/photo-1576814547952-f8531781d7ef?w=800&q=85&fit=crop",
  },
  {
    title: "Data Bundles",
    subtitle: "SME from ₦100",
    href: "/buy/data",
    gradient: "from-blue-500 via-cyan-500 to-teal-600",
    photo: "https://images.unsplash.com/photo-1761370981036-a08246d32c7d?w=800&q=85&fit=crop",
  },
  {
    title: "Electricity Bills",
    subtitle: "All 11 DISCOs",
    href: "/buy/electricity",
    gradient: "from-emerald-500 via-green-500 to-teal-600",
    photo: "https://images.unsplash.com/photo-1523376460408-aeb5f5d051b8?w=800&q=85&fit=crop",
  },
  {
    title: "Cable TV",
    subtitle: "DStv • GOtv • StarTimes",
    href: "/buy/cable",
    gradient: "from-purple-600 via-violet-600 to-indigo-700",
    photo: "https://images.unsplash.com/photo-1528429421263-b742bf08e211?w=800&q=85&fit=crop",
  },
  {
    title: "Exam Pins",
    subtitle: "WAEC • NECO • NABTEB",
    href: "/buy/exam-pins",
    gradient: "from-rose-500 via-pink-500 to-purple-600",
    photo: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=85&fit=crop",
  },
  {
    title: "Bulk Airtime",
    subtitle: "Up to 20 numbers",
    href: "/buy/bulk-airtime",
    gradient: "from-slate-700 via-slate-800 to-gray-900",
    photo: "https://images.unsplash.com/photo-1758691737543-09a1b2b715fa?w=800&q=85&fit=crop",
  },
];

const TOTAL = services.length;
const CARD_W = 300;
const GAP = 20;
const SLOT = CARD_W + GAP;

export default function Services() {
  // Triple array for infinite looping: [clones_end | real_cards | clones_start]
  const extended = useMemo(() => [...services, ...services, ...services], []);

  // trackIdx starts at TOTAL (first real card in middle section)
  const [trackIdx, setTrackIdx] = useState(TOTAL);
  // skipAnim=true → use duration:0 for the silent position snap
  const [skipAnim, setSkipAnim] = useState(false);
  const [paused, setPaused] = useState(false);
  const [centerOffset, setCenterOffset] = useState(0);
  const [tick, setTick] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef as React.RefObject<Element>, { once: true, amount: 0.1 });

  // Which real card index is visually active (0-5)
  const visualActive = ((trackIdx % TOTAL) + TOTAL) % TOTAL;

  // Measure container to keep active card centered
  useEffect(() => {
    function measure() {
      if (wrapperRef.current) {
        setCenterOffset((wrapperRef.current.offsetWidth - CARD_W) / 2);
      }
    }
    measure();
    const obs = new ResizeObserver(measure);
    if (wrapperRef.current) obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, []);

  // After skipAnim snap renders, re-enable smooth transitions
  useEffect(() => {
    if (!skipAnim) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSkipAnim(false));
    });
    return () => cancelAnimationFrame(id);
  }, [skipAnim]);

  // When track animation ends, silently snap back to the middle section
  const handleAnimComplete = useCallback(() => {
    if (skipAnim) return; // already snapping — don't loop
    if (trackIdx < TOTAL) {
      setSkipAnim(true);
      setTrackIdx(trackIdx + TOTAL);
    } else if (trackIdx >= 2 * TOTAL) {
      setSkipAnim(true);
      setTrackIdx(trackIdx - TOTAL);
    }
  }, [trackIdx, skipAnim]);

  // Auto-advance every 3 s; tick resets the interval after manual nav
  useEffect(() => {
    if (paused || !inView) return;
    const id = setInterval(() => {
      setTrackIdx((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(id);
  }, [paused, inView, tick]);

  const go = useCallback((delta: number) => {
    setTrackIdx((prev) => prev + delta);
    setTick((t) => t + 1);
  }, []);

  const goToSlide = useCallback(
    (slideIdx: number) => {
      const delta = slideIdx - visualActive;
      setTrackIdx((prev) => prev + delta);
      setTick((t) => t + 1);
    },
    [visualActive]
  );

  return (
    <section id="services" ref={sectionRef} className="py-16 sm:py-24 bg-[#f4f4f0]">

      {/* Section header */}
      <div className="text-center max-w-2xl mx-auto px-5 mb-12 sm:mb-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          className="text-xs font-bold text-accent tracking-[0.18em] uppercase mb-3"
        >
          What We Offer
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.08 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-[1.1]"
        >
          For every need,{" "}
          <span className="text-navy/25">one platform.</span>
        </motion.h2>
      </div>

      {/* Carousel track */}
      <div
        ref={wrapperRef}
        className="relative overflow-hidden select-none"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <motion.div
          className="flex"
          style={{ gap: GAP }}
          animate={{ x: centerOffset - trackIdx * SLOT }}
          transition={
            skipAnim
              ? { duration: 0 }
              : { type: "tween", duration: 0.5, ease: [0.32, 0.72, 0, 1] }
          }
          onAnimationComplete={handleAnimComplete}
        >
          {extended.map((s, i) => {
            const isActive = (i % TOTAL) === visualActive;
            return (
              <motion.div
                key={i}
                style={{ width: CARD_W, flexShrink: 0 }}
                animate={{
                  scale: isActive ? 1 : 0.88,
                  opacity: isActive ? 1 : 0.5,
                }}
                transition={{ type: "tween", duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              >
                <Link
                  href={s.href}
                  className="group relative block rounded-3xl overflow-hidden h-[440px] cursor-pointer"
                >
                  {/* Lifestyle photo */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${s.photo})` }}
                  />
                  {/* Gradient overlay — ensures readability even if photo fails */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${s.gradient} ${
                      isActive ? "opacity-40" : "opacity-60"
                    } transition-opacity duration-500 group-hover:opacity-40`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                  {/* Card content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-7">
                    <p className="text-white/60 text-[11px] font-semibold uppercase tracking-[0.12em] mb-1.5">
                      {s.subtitle}
                    </p>
                    <h3 className="text-white text-2xl font-extrabold mb-5 leading-tight">
                      {s.title}
                    </h3>
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm text-navy text-sm font-bold rounded-full hover:bg-white transition-colors shadow-lg w-fit">
                      Buy Now
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mt-8 px-5">
        {/* Prev */}
        <button
          onClick={() => go(-1)}
          className="p-2.5 rounded-full bg-white border border-border text-navy/40 hover:text-navy hover:border-navy/20 transition-all shadow-sm"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
            >
              <div
                className={`rounded-full transition-all duration-300 ${
                  i === visualActive
                    ? "w-5 h-2 bg-accent"
                    : "w-2 h-2 bg-navy/20 hover:bg-navy/40"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Next */}
        <button
          onClick={() => go(1)}
          className="p-2.5 rounded-full bg-white border border-border text-navy/40 hover:text-navy hover:border-navy/20 transition-all shadow-sm"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Pause / Play */}
        <button
          onClick={() => setPaused(!paused)}
          className={`ml-1 p-2.5 rounded-full border transition-all shadow-sm ${
            paused
              ? "bg-accent border-transparent text-white"
              : "bg-white border-border text-navy/40 hover:text-navy"
          }`}
          aria-label={paused ? "Resume" : "Pause"}
        >
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>
      </div>
    </section>
  );
}
