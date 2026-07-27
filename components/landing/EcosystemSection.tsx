"use client";

import { useState } from "react";

export function EcosystemSection() {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      title: "Smart QR Engine",
      tagline: "Programmable Dynamic Destinations",
      desc: "Change where printed QR codes point in real-time without reprinting physical collateral.",
      badge: "DYNAMIC",
      color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
      stats: "Dynamic Edits",
      detail: "Update targets based on time of day, location, or customer loyalty status.",
    },
    {
      title: "Review Routing",
      tagline: "Private Feedback & Google 5-Stars",
      desc: "Automatically route satisfied customers directly to your Google Review page while capturing negative experiences privately.",
      badge: "ROUTING",
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      stats: "+42% Ratings",
      detail: "Prevent negative public reviews before they happen with inline private support tickets.",
    },
    {
      title: "Mobile PWA Scanner",
      tagline: "Sub-Second Ticket Check-Ins",
      desc: "Turn staff smartphones into high-speed event scanners with camera reticle, torch toggle, and offline queueing.",
      badge: "CHECK-IN",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      stats: "0.1s Scan Speed",
      detail: "Supports offline sync, multi-gate authorization, and live attendance counter.",
    },
    {
      title: "Developer Platform",
      tagline: "REST APIs & Webhooks",
      desc: "Integrate QR creation, access control, and webhook event notifications into your existing software stack.",
      badge: "API & SDK",
      color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
      stats: "Node & Python SDKs",
      detail: "Complete API control over QR generation, workspace access, and analytics webhooks.",
    },
  ];

  return (
    <section id="ecosystem" className="py-24 bg-[#030712] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
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

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                activeTab === idx
                  ? "bg-slate-900/90 border-indigo-500/80 shadow-xl shadow-indigo-500/10"
                  : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40"
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${item.color}`}>
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
                  <p className="text-xs font-semibold text-indigo-400/90 mt-0.5">{item.tagline}</p>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>

              <div className="pt-4 border-t border-slate-900 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                <span>{item.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
