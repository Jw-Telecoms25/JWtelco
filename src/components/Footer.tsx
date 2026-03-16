"use client";

import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { JWGlobe } from "@/components/ui/JWLogo";

const footerLinks = {
  Services: [
    { label: "Buy Airtime", href: "/buy/airtime" },
    { label: "Buy Data", href: "/buy/data" },
    { label: "Electricity", href: "/buy/electricity" },
    { label: "Cable TV", href: "/buy/cable" },
    { label: "Exam Pins", href: "/buy/exam-pins" },
    { label: "Bulk Airtime", href: "/buy/bulk-airtime" },
  ],
  Company: [
    { label: "Pricing", href: "#pricing" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
  Support: [
    { label: "Help Center", href: "#faq" },
    { label: "WhatsApp Support", href: "https://wa.me/2347067721861" },
    { label: "Email Support", href: "mailto:support@jwtelecoms.com.ng" },
  ],
};

const socials = [
  { label: "WhatsApp", href: "https://wa.me/2347067721861" },
  { label: "Twitter / X", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "Facebook", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] relative">
      {/* Pre-footer CTA banner */}
      <div className="bg-[#f4f4f0] px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="relative bg-accent rounded-3xl p-8 sm:p-14 overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-black/10 rounded-full blur-[80px]" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2 leading-tight">
                  Ready to start saving?
                </h3>
                <p className="text-white/60 font-medium">
                  Join 50,000+ Nigerians who buy smarter.
                </p>
              </div>
              <a
                href="/register"
                className="flex-shrink-0 px-8 py-4 bg-white text-accent font-bold rounded-full hover:bg-white/90 transition-all hover:shadow-2xl active:scale-[0.98] text-sm sm:text-base"
              >
                Create Free Account →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-5 pt-16 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2">
            <a href="/" className="inline-flex items-center gap-2 mb-5">
              <JWGlobe size={30} />
              <span className="font-extrabold text-lg text-white tracking-tight">
                JW<span className="text-accent">Telecoms</span>
              </span>
            </a>
            <p className="text-sm text-white/35 leading-relaxed mb-6 max-w-xs">
              Nigeria&apos;s trusted platform for instant airtime, data bundles, bill
              payments, and digital services. Fast, secure, affordable.
            </p>
            <div className="space-y-3">
              <a
                href="tel:+2347067721861"
                className="flex items-center gap-3 text-sm text-white/40 hover:text-accent transition-colors"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                +234 706 772 1861
              </a>
              <a
                href="https://wa.me/2347067721861"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-white/40 hover:text-accent transition-colors"
              >
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                Chat on WhatsApp
              </a>
              <a
                href="mailto:support@jwtelecoms.com.ng"
                className="flex items-center gap-3 text-sm text-white/40 hover:text-accent transition-colors"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                support@jwtelecoms.com.ng
              </a>
              <p className="flex items-center gap-3 text-sm text-white/30">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                Lagos, Nigeria
              </p>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-5">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-sm text-white/35 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} JWTelecoms. All rights reserved.
          </p>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-xs text-white/25 hover:text-white transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
