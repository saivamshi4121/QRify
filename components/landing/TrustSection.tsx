"use client";

import { useRef } from "react";
import { useInView } from "@/hooks/useInView";

export function TrustSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.2 });

  const logos = [
    "RESTAURANTS GROUP",
    "HYATT HOTELS",
    "METRO CONFERENCES",
    "GLOBAL EVENTS INC",
    "APEX HEALTHCARE",
    "LUXURY HOSPITALITY",
  ];

  const stats = [
    { value: "250M+", label: "QR Scans Processed" },
    { value: "< 20ms", label: "Global Edge Latency" },
    { value: "99.99%", label: "Uptime SLA Guarantee" },
    { value: "180+", label: "Countries Supported" },
  ];

  return (
    <section ref={ref} className="py-16 bg-[#060a12] border-y border-slate-900 relative overflow-hidden">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 matrix-grid-fine opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 space-y-12 relative z-10">
        {/* Customer logos */}
        <div className="text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Trusted by fast-growing enterprises & top hospitality brands
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {logos.map((logo, i) => (
              <span
                key={i}
                className="text-sm md:text-base font-black tracking-wider text-slate-500/60 font-mono hover:text-slate-300 transition-colors duration-500 cursor-default"
                style={{
                  transform: inView ? "translateY(0)" : "translateY(12px)",
                  opacity: inView ? 1 : 0,
                  transition: `all 0.6s cubic-bezier(0.23,1,0.32,1) ${i * 0.08}s`,
                }}
              >
                {logo}
              </span>
            ))}
          </div>
        </div>

        {/* Enterprise metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-900/80">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="text-center space-y-1 group"
              style={{
                transform: inView ? "translateY(0) translateZ(0)" : "translateY(20px) translateZ(-10px)",
                opacity: inView ? 1 : 0,
                transition: `all 0.7s cubic-bezier(0.23,1,0.32,1) ${0.3 + idx * 0.1}s`,
              }}
            >
              <p className="text-3xl sm:text-4xl font-extrabold text-white font-mono group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-cyan-300 group-hover:bg-clip-text transition-all duration-300">
                {s.value}
              </p>
              <p className="text-xs font-semibold text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
