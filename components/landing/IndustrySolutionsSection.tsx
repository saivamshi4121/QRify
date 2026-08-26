"use client";

import { useState, useRef } from "react";
import { useInView } from "@/hooks/useInView";

export function IndustrySolutionsSection() {
  const [selectedIndustry, setSelectedIndustry] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.1 });

  const industries = [
    {
      title: "Restaurants & Cafés",
      tagline: "Turn table scans into Google 5-star reviews",
      desc: "Place Qrezo QR codes on table tents and receipts. Happy diners rate you on Google, while feedback for cold food or slow service stays private.",
      stat: "+38% Google Reviews",
      mockTitle: "Table #14 Review Flow",
    },
    {
      title: "Hotels & Hospitality",
      tagline: "Elevate guest experience scores before checkout",
      desc: "Allow hotel guests to scan QR cards in rooms or at the lobby bar to report issues to room service or share glowing reviews.",
      stat: "4.8 Avg Rating",
      mockTitle: "Lobby Bar Feedback",
    },
    {
      title: "Live Events & Festivals",
      tagline: "Ultra-fast ticket check-in at high volume gates",
      desc: "Issue secure QR tickets and staff your gates with our mobile PWA scanner app. Zero queue bottleneck guaranteed.",
      stat: "1,800+ Scans/Hr",
      mockTitle: "VIP Entrance Gate",
    },
    {
      title: "Healthcare & Clinics",
      tagline: "Contactless check-in & private patient survey",
      desc: "Provide quick QR check-ins in waiting rooms and gather private patient satisfaction metrics effortlessly.",
      stat: "100% HIPAA Ready",
      mockTitle: "Patient Check-in Desk",
    },
    {
      title: "Retail & Showrooms",
      tagline: "Interactive product story & customer ratings",
      desc: "Attach QR tags to display items so shoppers can view digital specs, check stock, and leave instant reviews.",
      stat: "+22% Engagement",
      mockTitle: "Product Tag Scanner",
    },
  ];

  const current = industries[selectedIndustry];

  return (
    <section id="solutions" ref={ref} className="py-24 bg-[#060a12] border-t border-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 matrix-grid-fine opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 space-y-16 relative z-10">
        <div
          className="text-center max-w-3xl mx-auto space-y-4"
          style={{
            transform: inView ? "translateY(0)" : "translateY(30px)",
            opacity: inView ? 1 : 0,
            transition: "all 0.8s cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Tailored Industry Solutions
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Designed for face-to-face customer businesses.
          </h3>
        </div>

        {/* Industry pill selector */}
        <div
          className="flex flex-wrap justify-center gap-3"
          style={{
            transform: inView ? "translateY(0)" : "translateY(20px)",
            opacity: inView ? 1 : 0,
            transition: "all 0.8s cubic-bezier(0.23,1,0.32,1) 0.15s",
          }}
        >
          {industries.map((ind, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndustry(i)}
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all duration-300 ${
                selectedIndustry === i
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/40"
                  : "bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
              }`}
            >
              {ind.title}
            </button>
          ))}
        </div>

        {/* Selected industry 3D card */}
        <div
          className="max-w-4xl mx-auto p-8 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative overflow-hidden perspective-deep"
          style={{
            background: "linear-gradient(145deg, #090d16, #0b1120)",
            border: "1px solid rgba(99,102,241,0.12)",
            boxShadow: "0 30px 60px -15px rgba(0,0,0,0.5), 0 0 60px rgba(99,102,241,0.06)",
            transform: inView ? "translateY(0) translateZ(0)" : "translateY(30px) translateZ(-20px)",
            opacity: inView ? 1 : 0,
            transition: "all 0.8s cubic-bezier(0.23,1,0.32,1) 0.3s",
          }}
        >
          {/* Decorative corner glow */}
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)" }} />

          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-widest uppercase">
              {current.stat}
            </span>
            <h4 className="text-2xl font-bold text-white">{current.tagline}</h4>
            <p className="text-slate-400 text-sm leading-relaxed">{current.desc}</p>
            <button className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-colors hover:border-indigo-500/30">
              Explore {current.title} Case Study
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
              <span>{current.mockTitle}</span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400">Customer scanned QR code</p>
              <p className="text-lg font-bold text-white">{current.title} Portal</p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 w-3/4 animate-pulse" />
              </div>
              <p className="text-[10px] text-emerald-400 font-mono">Instant Redirect Active</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
