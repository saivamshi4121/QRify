"use client";

import { useRef, useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";

export function EcosystemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.1 });
  const [mouseX, setMouseX] = useState(0);

  const features = [
    {
      title: "Smart QR Engine",
      tagline: "Programmable Dynamic Destinations",
      desc: "Change where printed QR codes point in real-time without reprinting physical collateral.",
      badge: "DYNAMIC",
      accent: "#818cf8",
      accentBg: "rgba(99,102,241,0.12)",
      accentBorder: "rgba(99,102,241,0.35)",
      stat: "Dynamic Edits",
      detail: "Update targets based on time, location, or loyalty status.",
      icon: "QR",
    },
    {
      title: "Review Routing",
      tagline: "Private Feedback & Google 5-Stars",
      desc: "Route satisfied customers to Google Reviews. Capture negative feedback privately before it goes public.",
      badge: "ROUTING",
      accent: "#fbbf24",
      accentBg: "rgba(245,158,11,0.12)",
      accentBorder: "rgba(245,158,11,0.35)",
      stat: "+42% Ratings",
      detail: "Prevent negative public reviews with inline private support.",
      icon: "REV",
    },
    {
      title: "Mobile PWA Scanner",
      tagline: "Sub-Second Ticket Check-Ins",
      desc: "Turn staff smartphones into high-speed event scanners with camera reticle and offline queueing.",
      badge: "CHECK-IN",
      accent: "#34d399",
      accentBg: "rgba(52,211,153,0.12)",
      accentBorder: "rgba(52,211,153,0.35)",
      stat: "0.1s Scan",
      detail: "Offline sync, multi-gate auth, live attendance counter.",
      icon: "SCN",
    },
    {
      title: "Developer Platform",
      tagline: "REST APIs & Webhooks",
      desc: "Integrate QR creation, access control, and webhook notifications into your existing software stack.",
      badge: "API & SDK",
      accent: "#22d3ee",
      accentBg: "rgba(34,211,238,0.12)",
      accentBorder: "rgba(34,211,238,0.35)",
      stat: "Node & Python",
      detail: "Complete API control over QR, workspaces, and analytics.",
      icon: "API",
    },
  ];

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMouseX((e.clientX / window.innerWidth - 0.5) * 2);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <section id="ecosystem" ref={ref} className="py-32 bg-[#030712] relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%)" }}
      />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 60%)" }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px",
        maskImage: "radial-gradient(ellipse 60% 40% at 50% 50%, black 0%, transparent 60%)",
        WebkitMaskImage: "radial-gradient(ellipse 60% 40% at 50% 50%, black 0%, transparent 60%)",
      }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div
          className="text-center max-w-3xl mx-auto space-y-5 mb-20"
          style={{
            transform: inView ? "translateY(0)" : "translateY(50px)",
            opacity: inView ? 1 : 0,
            transition: "all 1s cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/[0.06]">
            <span className="text-[10px] font-mono text-indigo-300/80 tracking-widest uppercase">Product Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            One platform.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              Every QR interaction.
            </span>
          </h2>
          <p className="text-base text-slate-400 max-w-xl mx-auto">
            From smart restaurant tables to stadium gates — end-to-end tooling for programmable QR systems.
          </p>
        </div>

        {/* 3D Arc Feature Display */}
        <div className="relative" style={{ perspective: "1400px" }}>
          {/* Center orbit ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none hidden lg:block">
            <div className="absolute inset-0 rounded-full border border-cyan-500/[0.06]"
              style={{ animation: "ring-rotate 30s linear infinite" }}
            />
            <div className="absolute inset-8 rounded-full border border-indigo-500/[0.05]"
              style={{ animation: "ring-rotate 25s linear infinite reverse" }}
            />
            <div className="absolute inset-16 rounded-full border border-purple-500/[0.04]"
              style={{ animation: "ring-rotate 20s linear infinite" }}
            />
          </div>

          {/* Feature cards in 3D arc */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6"
            style={{
              transform: `rotateY(${mouseX * 3}deg)`,
              transition: "transform 0.4s cubic-bezier(0.23,1,0.32,1)",
              transformStyle: "preserve-3d",
            }}
          >
            {features.map((item, idx) => {
              const rotateY = idx === 0 ? -6 : idx === 1 ? -2 : idx === 2 ? 2 : 6;
              const translateZ = idx === 0 || idx === 3 ? -20 : 0;

              return (
                <div
                  key={idx}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    transform: inView
                      ? `perspective(800px) rotateY(${rotateY}deg) translateZ(${translateZ}px)`
                      : `perspective(800px) rotateY(${rotateY}deg) translateZ(-60px) rotateX(10deg)`,
                    opacity: inView ? 1 : 0,
                    transition: `all 0.9s cubic-bezier(0.23,1,0.32,1) ${idx * 0.15}s`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {/* Card body */}
                  <div
                    className="relative p-6 h-full rounded-2xl transition-all duration-500"
                    style={{
                      background: "linear-gradient(160deg, #0d1225 0%, #080c18 100%)",
                      border: `1px solid ${item.accentBorder}`,
                      boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), 0 0 40px ${item.accentBg}`,
                    }}
                  >
                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${item.accentBg} 0%, transparent 60%)`,
                      }}
                    />

                    {/* Top edge glow line */}
                    <div
                      className="absolute top-0 left-4 right-4 h-px opacity-40 group-hover:opacity-80 transition-opacity"
                      style={{ background: `linear-gradient(90deg, transparent, ${item.accent}, transparent)` }}
                    />

                    <div className="relative z-10 space-y-5">
                      {/* Badge + Icon */}
                      <div className="flex items-center justify-between">
                        <span
                          className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase"
                          style={{
                            background: item.accentBg,
                            border: `1px solid ${item.accentBorder}`,
                            color: item.accent,
                          }}
                        >
                          {item.badge}
                        </span>
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-[11px] font-black font-mono"
                          style={{
                            background: item.accentBg,
                            border: `1px solid ${item.accentBorder}`,
                            color: item.accent,
                            boxShadow: `0 0 20px ${item.accentBg}`,
                          }}
                        >
                          {item.icon}
                        </div>
                      </div>

                      {/* Title */}
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-white/90 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs font-semibold mt-1" style={{ color: item.accent }}>
                          {item.tagline}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    {/* Bottom bar */}
                    <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-500">{item.detail}</span>
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                        style={{ background: item.accentBg, color: item.accent }}
                      >
                        {item.stat}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
