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
  { label: "Twitter", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "Facebook", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-navy relative noise-bg">
      {/* CTA Banner */}
      <div className="mx-auto max-w-7xl px-5 -translate-y-1/2">
        <div className="relative bg-accent rounded-3xl p-8 sm:p-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
                Ready to start saving?
              </h3>
              <p className="text-navy/60 font-medium">
                Join 50,000+ Nigerians who buy smarter.
              </p>
            </div>
            <a
              href="/register"
              className="px-7 py-4 bg-navy text-white font-bold rounded-2xl hover:bg-navy-light transition-all hover:shadow-xl flex-shrink-0 active:scale-[0.98]"
            >
              Create Free Account
            </a>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-5 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10">
          {/* Brand column */}
          <div className="col-span-2">
            <a href="#" className="inline-flex items-center gap-2 mb-5">
              <JWGlobe size={32} />
              <span className="font-bold text-lg text-white tracking-tight">
                JW<span className="text-accent">Telecoms</span>
              </span>
            </a>
            <p className="text-sm text-white/40 leading-relaxed mb-6 max-w-xs">
              Nigeria&apos;s trusted platform for instant airtime, data bundles, bill
              payments, and digital services. Fast, secure, affordable.
            </p>
            <div className="space-y-3">
              <a
                href="tel:+2347067721861"
                className="flex items-center gap-3 text-sm text-white/50 hover:text-accent transition-colors"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                +234 706 772 1861
              </a>
              <a
                href="https://wa.me/2347067721861"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-white/50 hover:text-accent transition-colors"
              >
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                Chat on WhatsApp
              </a>
              <a
                href="mailto:support@jwtelecoms.com.ng"
                className="flex items-center gap-3 text-sm text-white/50 hover:text-accent transition-colors"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                support@jwtelecoms.com.ng
              </a>
              <p className="flex items-center gap-3 text-sm text-white/40">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                Lagos, Nigeria
              </p>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white/80 mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-sm text-white/40 hover:text-accent transition-colors"
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
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} JWTelecoms. All rights reserved.
          </p>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-xs text-white/30 hover:text-accent transition-colors"
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
