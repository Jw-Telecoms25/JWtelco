"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star } from "lucide-react";

interface Review {
  name: string;
  handle: string;
  avatar: string;
  text: string;
  rating: number;
  network: string;
  networkColor: string;
}

const reviews: Review[] = [
  {
    name: "Adebayo Ogunlesi",
    handle: "@adebayo_og",
    avatar: "AO",
    text: "I've been using JWTelecoms for 6 months now. The speed is unmatched — my data loads before I even switch apps. Best VTU platform I've used.",
    rating: 5,
    network: "MTN",
    networkColor: "bg-yellow-400 text-black",
  },
  {
    name: "Chidinma Nwosu",
    handle: "@chidinma_n",
    avatar: "CN",
    text: "Switched from my bank app to JWTelecoms. The prices are cheaper and the delivery is instant. My whole family uses it now. No going back!",
    rating: 5,
    network: "Airtel",
    networkColor: "bg-red-500 text-white",
  },
  {
    name: "Fatima Ibrahim",
    handle: "@fatima_ib",
    avatar: "FI",
    text: "I run a POS business and JWTelecoms is my go-to for bulk data purchases. The reseller discount is amazing and support is always available.",
    rating: 5,
    network: "Glo",
    networkColor: "bg-green-500 text-white",
  },
  {
    name: "Emeka Okafor",
    handle: "@emeka_ok",
    avatar: "EO",
    text: "Paid my EKEDC electricity bill at midnight and got my token in under 10 seconds. I was shocked. These guys are the real deal.",
    rating: 5,
    network: "Bills",
    networkColor: "bg-cyan-500 text-white",
  },
  {
    name: "Aisha Mohammed",
    handle: "@aisha_mo",
    avatar: "AM",
    text: "My WAEC result checker PIN was delivered instantly. I was stressing but JWTelecoms came through. God bless whoever built this platform!",
    rating: 5,
    network: "Education",
    networkColor: "bg-purple-500 text-white",
  },
  {
    name: "Oluwaseun Bakare",
    handle: "@seun_bak",
    avatar: "OB",
    text: "As a student, every kobo counts. JWTelecoms gives me the cheapest data I've found anywhere. The 2GB for ₦500 plan is a lifesaver.",
    rating: 5,
    network: "MTN",
    networkColor: "bg-yellow-400 text-black",
  },
  {
    name: "Grace Adeyemi",
    handle: "@grace_ade",
    avatar: "GA",
    text: "Customer service is top tier. I had an issue once and they resolved it in 2 minutes on WhatsApp. Never experienced that with any other platform.",
    rating: 5,
    network: "9mobile",
    networkColor: "bg-green-700 text-white",
  },
  {
    name: "Tunde Williams",
    handle: "@tunde_w",
    avatar: "TW",
    text: "I've tried about 5 different VTU platforms. JWTelecoms is the only one that has never failed me. Not even once. That says a lot.",
    rating: 5,
    network: "Airtel",
    networkColor: "bg-red-500 text-white",
  },
  {
    name: "Blessing Eze",
    handle: "@blessing_e",
    avatar: "BE",
    text: "My GOtv subscription renews automatically through JWTelecoms. Set it and forget it. I love how smooth everything works.",
    rating: 4,
    network: "Cable TV",
    networkColor: "bg-indigo-500 text-white",
  },
  {
    name: "Yusuf Abdullahi",
    handle: "@yusuf_abd",
    avatar: "YA",
    text: "Started as a user, now I'm a reseller. JWTelecoms gave me the tools to start my own mini VTU business. Making good money from it too!",
    rating: 5,
    network: "Reseller",
    networkColor: "bg-navy text-white",
  },
];

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="flex-shrink-0 w-[320px] sm:w-[380px] p-6 bg-white rounded-3xl border border-border hover:border-accent/25 hover:shadow-2xl hover:shadow-accent/8 hover:-translate-y-1 transition-all duration-300 group cursor-pointer mx-2.5 relative overflow-hidden">
      {/* Large decorative quote */}
      <span className="absolute top-4 right-5 text-[72px] leading-none font-black text-accent/6 pointer-events-none select-none">"</span>

      {/* Stars first — grabs attention */}
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"
            }`}
          />
        ))}
      </div>

      <p className="text-sm text-navy/80 leading-relaxed mb-5 relative z-10">{review.text}</p>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-xs font-extrabold text-accent ring-2 ring-accent/15">
          {review.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-navy text-sm leading-tight">{review.name}</p>
          <p className="text-[11px] text-muted">{review.handle}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${review.networkColor}`}>
          {review.network}
        </span>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.05 });

  const row1 = reviews.slice(0, 5);
  const row2 = reviews.slice(5);

  return (
    <section id="testimonials" className="py-16 sm:py-24 bg-white relative overflow-hidden" style={{ overflowX: "hidden" }}>
      <div ref={ref}>
        <div className="mx-auto max-w-7xl px-6 mb-16">
          <div className="text-center max-w-2xl mx-auto">
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              className="text-sm font-semibold text-accent tracking-wide uppercase mb-3"
            >
              Customer Reviews
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-[1.1]"
            >
              Loved by thousands.{" "}
              <span className="text-navy/25">Here&apos;s what they say.</span>
            </motion.h2>
          </div>
        </div>

        {/* Marquee rows */}
        <div className="space-y-4">
          {/* Row 1 — scrolls left */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div className="flex animate-marquee">
              {[...row1, ...row1].map((review, i) => (
                <ReviewCard key={`r1-${i}`} review={review} />
              ))}
            </div>
          </motion.div>

          {/* Row 2 — scrolls right */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
            className="relative"
          >
            <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div className="flex animate-marquee-reverse">
              {[...row2, ...row2].map((review, i) => (
                <ReviewCard key={`r2-${i}`} review={review} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
