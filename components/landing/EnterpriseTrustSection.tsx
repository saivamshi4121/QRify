"use client";

import { useRef } from "react";
import { useInView } from "@/hooks/useInView";

export function EnterpriseTrustSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.1 });

  const trustPoints = [
    {
      title: "Enterprise Grade Security",
      desc: "End-to-end tokenized QR credentials with encrypted validation payload headers.",
      badge: "SECURITY",
      badgeClass: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    },
    {
      title: "Sub-20ms Global Routing",
      desc: "Distributed edge network ensures instantaneous destination resolution across all continents.",
      badge: "VELOCITY",
      badgeClass: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    },
    {
      title: "SOC2 & GDPR Compliance",
      desc: "Built to stringent data privacy guidelines with optional data retention policies.",
      badge: "COMPLIANCE",
      badgeClass: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    },
    {
      title: "Offline Camera PWA Sync",
      desc: "Scanners continue checking in attendees during network drops and sync as soon as connectivity resumes.",
      badge: "OFFLINE SYNC",
      badgeClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    },
    {
      title: "Granular Multi-Gate RBAC",
      desc: "Assign staff members to specific gates, events, or workspaces with restricted permissions.",
      badge: "PERMISSIONS",
      badgeClass: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    },
    {
      title: "Real-time Telemetry & Alerts",
      desc: "Instant SMS & Email triggers for unexpected scan failures or low rating submissions.",
      badge: "TELEMETRY",
      badgeClass: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    },
  ];

  return (
    <section ref={ref} className="py-24 bg-[#060a12] border-t border-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 matrix-grid-fine opacity-15 pointer-events-none" />

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
            Enterprise Architecture
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Security & performance built-in from day one.
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ perspective: "1200px" }}>
          {trustPoints.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl space-y-3 card-3d group"
              style={{
                background: "linear-gradient(145deg, #0c1020, #090d16)",
                border: "1px solid rgba(99,102,241,0.12)",
                transform: inView
                  ? `perspective(800px) rotateY(${(idx % 3 - 1) * 4}deg) translateZ(0)`
                  : `perspective(800px) rotateY(${(idx % 3 - 1) * 4}deg) translateZ(-30px)`,
                opacity: inView ? 1 : 0,
                transition: `all 0.8s cubic-bezier(0.23,1,0.32,1) ${0.1 + idx * 0.08}s`,
                boxShadow: "0 15px 30px -10px rgba(0,0,0,0.3), 0 0 15px rgba(99,102,241,0.03)",
              }}
            >
              <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase border inline-block ${item.badgeClass}`}>
                {item.badge}
              </span>
              <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
