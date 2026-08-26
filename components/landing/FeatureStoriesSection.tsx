"use client";

import { useRef } from "react";
import { useInView } from "@/hooks/useInView";

export function FeatureStoriesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.05 });

  const stories = [
    {
      num: "01",
      badge: "SMART ROUTING",
      title: "Protect your public rating while collecting authentic 5-star reviews.",
      desc: "Qrezo's Review Pages intelligently separate satisfied guests from those who had an issue. Happy customers are routed directly to your Google Business listing, while unhappy guests submit private feedback straight to your inbox.",
      highlights: [
        "Automated star-rating threshold rules",
        "Direct Google Business profile integration",
        "Instant SMS/Email alerts for negative feedback",
      ],
      previewType: "reviews" as const,
    },
    {
      num: "02",
      badge: "DYNAMIC RE-DESTINATION",
      title: "Update physical QR codes dynamically without reprinting a single sheet.",
      desc: "Never reprint menus, table tents, or event collateral again. Change the destination URL of any deployed Qrezo QR code instantly from your central dashboard.",
      highlights: [
        "Time-of-day scheduled dynamic URL shifts",
        "A/B testing destination pages",
        "Full UTM tracking and geo-analytics",
      ],
      previewType: "routing" as const,
    },
    {
      num: "03",
      badge: "EVENT TICKETING & SCANNER",
      title: "Sub-second event entry validation with offline fallback reliability.",
      desc: "Empower staff members with the Qrezo Mobile Scanner PWA. Validate tickets instantly at the gate, track throughput velocity in real time, and maintain check-in operations even during internet outages.",
      highlights: [
        "Zero-app install PWA for iOS & Android",
        "Built-in camera reticle & flashlight control",
        "Real-time multi-gate synchronization",
      ],
      previewType: "scanner" as const,
    },
  ];

  return (
    <section id="features" ref={ref} className="py-24 bg-[#030712] relative overflow-hidden">
      <div className="absolute inset-0 matrix-grid opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 space-y-24 relative z-10">
        <div
          className="text-center max-w-3xl mx-auto space-y-4"
          style={{
            transform: inView ? "translateY(0)" : "translateY(30px)",
            opacity: inView ? 1 : 0,
            transition: "all 0.8s cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Engineered for Modern Operations
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Built to solve real business challenges.
          </h3>
        </div>

        <div className="space-y-20">
          {stories.map((story, i) => (
            <div
              key={i}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}
              style={{
                transform: inView ? "translateY(0)" : "translateY(40px)",
                opacity: inView ? 1 : 0,
                transition: `all 0.8s cubic-bezier(0.23,1,0.32,1) ${0.2 + i * 0.15}s`,
              }}
            >
              {/* Text */}
              <div className={`space-y-6 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-indigo-500 font-mono">{story.num}</span>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold tracking-widest uppercase">
                    {story.badge}
                  </span>
                </div>
                <h4 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                  {story.title}
                </h4>
                <p className="text-slate-400 text-base leading-relaxed">{story.desc}</p>
                <ul className="space-y-2.5 pt-2">
                  {story.highlights.map((h, hIdx) => (
                    <li key={hIdx} className="flex items-center gap-3 text-sm text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3D Story visual — DRAMATIC */}
              <div
                className={`p-8 rounded-3xl space-y-4 relative overflow-hidden ${i % 2 === 1 ? "lg:order-1" : ""}`}
                style={{
                  background: "linear-gradient(145deg, #0c1020, #090d16)",
                  border: "1px solid rgba(99,102,241,0.15)",
                  transform: i % 2 === 0
                    ? "perspective(800px) rotateY(-6deg) rotateX(2deg)"
                    : "perspective(800px) rotateY(6deg) rotateX(2deg)",
                  boxShadow: "0 40px 80px -15px rgba(0,0,0,0.5), 0 0 50px rgba(99,102,241,0.08), 0 0 0 1px rgba(99,102,241,0.1)",
                  transition: "transform 0.5s cubic-bezier(0.23,1,0.32,1)",
                }}
              >
                {/* Corner glow */}
                <div
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)" }}
                />

                {story.previewType === "reviews" && (
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                      <span>RATING THRESHOLD</span>
                      <span className="text-emerald-400 font-bold">4.0 Stars & Above → Google</span>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                      Rating: 5.0 / 5.0 → Automatically Redirecting to Google Reviews
                    </div>
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                      Rating: 2.0 / 5.0 → Captured as Private Feedback (SMS alert dispatched)
                    </div>
                  </div>
                )}

                {story.previewType === "routing" && (
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>DEPLOYED QR: qr.qrezo.com/tbl-09</span>
                      <span className="text-indigo-400 font-bold">UPDATED LIVE</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between text-white">
                        <span>12:00 PM - 5:00 PM</span>
                        <span className="text-slate-400">Lunch Menu PDF</span>
                      </div>
                      <div className="p-3 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex justify-between text-white font-semibold">
                        <span>5:00 PM - 11:00 PM (CURRENT)</span>
                        <span className="text-indigo-300">Dinner Review Page</span>
                      </div>
                    </div>
                  </div>
                )}

                {story.previewType === "scanner" && (
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                      <span>GATE THROUGHPUT</span>
                      <span className="text-emerald-400 font-bold">1,840 check-ins / hr</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center text-xs text-white">
                      <span>Main Entrance Scanner #1</span>
                      <span className="font-mono text-emerald-400">Sync: 0.08s</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center text-xs text-white">
                      <span>VIP Gate Scanner #2</span>
                      <span className="font-mono text-emerald-400">Sync: 0.12s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
