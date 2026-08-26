"use client";

import { useRef } from "react";
import { useInView } from "@/hooks/useInView";

export function EcosystemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.1 });

  const features = [
    {
      title: "Smart QR Engine",
      tagline: "Programmable Dynamic Destinations",
      desc: "Change where printed QR codes point in real-time without reprinting physical collateral.",
      badge: "DYNAMIC",
      badgeBg: "rgba(99,102,241,0.12)",
      badgeBorder: "rgba(99,102,241,0.3)",
      badgeText: "#818cf8",
      stats: "Dynamic Edits",
      detail: "Update targets based on time of day, location, or customer loyalty status.",
      rotateY: -5,
      glow: "rgba(99,102,241,0.08)",
    },
    {
      title: "Review Routing",
      tagline: "Private Feedback & Google 5-Stars",
      desc: "Automatically route satisfied customers directly to your Google Review page while capturing negative experiences privately.",
      badge: "ROUTING",
      badgeBg: "rgba(245,158,11,0.12)",
      badgeBorder: "rgba(245,158,11,0.3)",
      badgeText: "#fbbf24",
      stats: "+42% Ratings",
      detail: "Prevent negative public reviews before they happen with inline private support tickets.",
      rotateY: -2,
      glow: "rgba(245,158,11,0.06)",
    },
    {
      title: "Mobile PWA Scanner",
      tagline: "Sub-Second Ticket Check-Ins",
      desc: "Turn staff smartphones into high-speed event scanners with camera reticle, torch toggle, and offline queueing.",
      badge: "CHECK-IN",
      badgeBg: "rgba(52,211,153,0.12)",
      badgeBorder: "rgba(52,211,153,0.3)",
      badgeText: "#34d399",
      stats: "0.1s Scan Speed",
      detail: "Supports offline sync, multi-gate authorization, and live attendance counter.",
      rotateY: 2,
      glow: "rgba(52,211,153,0.06)",
    },
    {
      title: "Developer Platform",
      tagline: "REST APIs & Webhooks",
      desc: "Integrate QR creation, access control, and webhook event notifications into your existing software stack.",
      badge: "API & SDK",
      badgeBg: "rgba(34,211,238,0.12)",
      badgeBorder: "rgba(34,211,238,0.3)",
      badgeText: "#22d3ee",
      stats: "Node & Python SDKs",
      detail: "Complete API control over QR generation, workspace access, and analytics webhooks.",
      rotateY: 5,
      glow: "rgba(34,211,238,0.06)",
    },
  ];

  return (
    <section id="ecosystem" ref={ref} className="py-24 bg-[#030712] relative overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 70% 50% at 50% 50%, black 10%, transparent 65%)",
        WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 50%, black 10%, transparent 65%)",
      }} />

      <div className="max-w-7xl mx-auto px-6 space-y-16 relative z-10">
        {/* Header */}
        <div
          className="text-center max-w-3xl mx-auto space-y-4"
          style={{
            transform: inView ? "translateY(0)" : "translateY(40px)",
            opacity: inView ? 1 : 0,
            transition: "all 0.8s cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Unified Product Ecosystem
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            One platform powering every QR interaction.
          </h3>
          <p className="text-base sm:text-lg text-slate-400">
            From smart restaurant review tables to high-concurrency stadium gates, Qrezo provides end-to-end tooling.
          </p>
        </div>

        {/* 3D Feature cards — DRAMATIC */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: "1200px" }}>
          {features.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl flex flex-col justify-between group cursor-pointer card-3d"
              style={{
                background: `linear-gradient(145deg, #0c1020, #090d16)`,
                border: "1px solid rgba(99,102,241,0.15)",
                transform: inView
                  ? `perspective(800px) rotateY(${item.rotateY}deg) translateZ(0)`
                  : `perspective(800px) rotateY(${item.rotateY}deg) translateZ(-40px)`,
                opacity: inView ? 1 : 0,
                transition: `all 0.8s cubic-bezier(0.23,1,0.32,1) ${idx * 0.12}s`,
                boxShadow: `0 20px 40px -15px rgba(0,0,0,0.4), 0 0 30px ${item.glow}`,
              }}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span
                    className="px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase"
                    style={{ background: item.badgeBg, border: `1px solid ${item.badgeBorder}`, color: item.badgeText }}
                  >
                    {item.badge}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    {item.stats}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: item.badgeText }}>
                    {item.tagline}
                  </p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                <span>{item.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
