"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import SpecularButton from "@/components/ui/SpecularButton";

function QRFragment({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const cells = [
    [1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,0,1],
    [0,1,0,1, 1,0,1,0, 0,1,0,1, 1,0,1,0],
    [1,1,0,0, 1,1,0,0, 0,0,1,1, 0,0,1,1],
    [0,0,1,1, 0,0,1,1, 1,1,0,0, 1,1,0,0],
  ];
  const pattern = cells[Math.floor(Math.random() * cells.length)];
  return (
    <div className={`absolute pointer-events-none ${className}`} style={style}>
      <div className="w-full h-full rounded-xl overflow-hidden" style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.1))",
        border: "1.5px solid rgba(99,102,241,0.35)",
        boxShadow: "0 0 40px rgba(99,102,241,0.15), inset 0 0 30px rgba(34,211,238,0.05)",
      }}>
        <div className="grid grid-cols-4 grid-rows-4 gap-[3px] p-3 h-full">
          {pattern.map((filled, i) => (
            <div
              key={i}
              className="rounded-[2px]"
              style={{
                background: filled
                  ? "linear-gradient(135deg, rgba(99,102,241,0.7), rgba(34,211,238,0.5))"
                  : "rgba(255,255,255,0.03)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Particle({ delay, left, size }: { delay: number; left: string; size: number }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left,
        bottom: "-10px",
        background: "radial-gradient(circle, rgba(34,211,238,0.9), rgba(99,102,241,0.6))",
        boxShadow: `0 0 ${size * 3}px rgba(34,211,238,0.5)`,
        animation: `particle-rise ${6 + delay * 1.5}s linear ${delay}s infinite, particle-drift ${3 + delay * 0.8}s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden bg-[#030712]">
      {/* Matrix grid floor — very visible */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 10%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 10%, transparent 70%)",
      }} />

      {/* Fine sub-grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(34,211,238,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34,211,238,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "24px 24px",
        maskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, black 5%, transparent 60%)",
        WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, black 5%, transparent 60%)",
      }} />

      {/* Giant glow orb — very visible */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.15) 30%, transparent 65%)",
          animation: "glow-pulse 5s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 60%)",
          animation: "glow-pulse 7s ease-in-out 1.5s infinite",
        }}
      />
      <div
        className="absolute bottom-1/3 right-1/5 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 55%)",
          animation: "glow-pulse 6s ease-in-out 3s infinite",
        }}
      />

      {/* Floating QR fragments — BIG and BRIGHT */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" ref={containerRef}>
        <QRFragment
          className="w-40 h-40 md:w-52 md:h-52 top-[8%] left-[5%] opacity-90"
          style={{ animation: "qr-float-1 12s ease-in-out infinite" }}
        />
        <QRFragment
          className="w-32 h-32 md:w-40 md:h-40 top-[12%] right-[8%] opacity-80"
          style={{ animation: "qr-float-2 14s ease-in-out 1s infinite" }}
        />
        <QRFragment
          className="w-28 h-28 md:w-36 md:h-36 bottom-[22%] left-[10%] opacity-70"
          style={{ animation: "qr-float-3 10s ease-in-out 2s infinite" }}
        />
        <QRFragment
          className="w-36 h-36 md:w-44 md:h-44 bottom-[28%] right-[5%] opacity-75"
          style={{ animation: "qr-float-1 15s ease-in-out 3s infinite" }}
        />
        <QRFragment
          className="w-24 h-24 md:w-28 md:h-28 top-[42%] left-[3%] opacity-60"
          style={{ animation: "qr-float-2 11s ease-in-out 4s infinite" }}
        />
        <QRFragment
          className="w-20 h-20 md:w-24 md:h-24 top-[20%] right-[25%] opacity-50"
          style={{ animation: "qr-float-3 13s ease-in-out 2.5s infinite" }}
        />
      </div>

      {/* Rising particles — bigger and brighter */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 25 }).map((_, i) => (
          <Particle
            key={i}
            delay={i * 0.5}
            left={`${3 + (i * 4) % 94}%`}
            size={i % 4 === 0 ? 8 : i % 3 === 0 ? 6 : i % 2 === 0 ? 5 : 4}
          />
        ))}
      </div>

      {/* Content with mouse-tracking 3D */}
      <div
        className="max-w-7xl mx-auto px-6 relative z-10"
        style={{
          transform: `perspective(1200px) rotateY(${mousePos.x * 2}deg) rotateX(${-mousePos.y * 1.5}deg)`,
          transition: "transform 0.2s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Version pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/[0.08] text-cyan-300 text-xs font-semibold backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
            </span>
            Qrezo v2.0 — Programmable QR Matrix Platform
          </div>

          {/* Main headline with DEEP glow */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            The Enterprise Platform for{" "}
            <br className="hidden sm:inline" />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                Programmable QR Code Systems.
              </span>
              <span
                className="absolute -inset-x-6 -inset-y-3 bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-cyan-500/25 blur-2xl pointer-events-none"
                style={{ animation: "glow-pulse 3.5s ease-in-out infinite" }}
              />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-300/90 max-w-2xl mx-auto leading-relaxed">
            Generate dynamic QR codes, automate Google review routing, manage high-volume event check-ins, and orchestrate customer touchpoints in one unified workspace.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <SpecularButton
                size="lg"
                radius={12}
                tint="#4f46e5"
                tintOpacity={0.9}
                blur={8}
                textColor="#ffffff"
                lineColor="#818cf8"
                baseColor="#3730a3"
                intensity={1.3}
                shineSize={12}
                shineFade={40}
                thickness={1.5}
                autoAnimate={true}
                speed={0.4}
              >
                Start Building Free
              </SpecularButton>
            </Link>
            <a
              href="#showcase"
              className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/20 text-white font-semibold text-sm transition-all backdrop-blur-md hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              Explore Live Showcase
            </a>
          </div>

          {/* Trust bullets */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-300 pt-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              No Credit Card Required
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
              Instant API Access
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
              99.99% Uptime SLA
            </div>
          </div>
        </div>

        {/* 3D Dashboard Mockup */}
        <div className="mt-20 relative max-w-5xl mx-auto" style={{ perspective: "1200px" }}>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              borderColor: "rgba(99,102,241,0.25)",
              background: "linear-gradient(145deg, #090d16, #0b1120)",
              boxShadow: "0 0 80px rgba(99,102,241,0.15), 0 40px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)",
              transform: `rotateX(3deg) rotateY(${mousePos.x * -1.5}deg)`,
              transition: "transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Top bar */}
            <div className="px-4 py-3 bg-[#0f172a]/90 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70 inline-block" />
                <span className="ml-2 text-xs font-mono text-slate-400">app.qrezo.com/dashboard/analytics</span>
              </div>
              <div className="text-xs font-mono text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded border border-emerald-500/25 shadow-[0_0_12px_rgba(52,211,153,0.15)]">
                LIVE DATA SYNCING
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total QR Scans", val: "1,482,920", change: "+24.8%" },
                  { label: "Google Reviews Routed", val: "94,310", change: "+18.2%" },
                  { label: "Active Gate Scanners", val: "14 Devices", change: "ONLINE" },
                  { label: "Scan Latency", val: "18ms avg", change: "OPTIMAL" },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/15 hover:border-indigo-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                    <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
                    <p className="text-xl md:text-2xl font-bold text-white font-mono mt-1">{stat.val}</p>
                    <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded shadow-[0_0_8px_rgba(52,211,153,0.1)]">
                      {stat.change}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Scan Velocity (24 Hours)</h4>
                    <span className="text-xs text-cyan-400 font-mono">14,200 Scans/hr peak</span>
                  </div>
                  <div className="h-32 flex items-end justify-between gap-1.5 pt-4">
                    {[40, 65, 50, 85, 95, 75, 100, 80, 90, 110, 130, 95, 120, 140, 110, 150].map((h, idx) => (
                      <div
                        key={idx}
                        className="w-full rounded-t transition-all duration-300 hover:brightness-125 cursor-pointer"
                        style={{
                          height: `${h}%`,
                          background: `linear-gradient(to top, rgba(99,102,241,0.9), rgba(34,211,238,${0.5 + h / 400}))`,
                          boxShadow: `0 0 ${h / 10}px rgba(99,102,241,0.2)`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Real-time Check-ins</h4>
                  <ul className="space-y-2.5 text-xs">
                    <li className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex justify-between items-center text-white hover:border-emerald-500/50 hover:shadow-[0_0_12px_rgba(52,211,153,0.1)] transition-all">
                      <span className="font-semibold">Sarah Connor (VIP)</span>
                      <span className="text-[10px] font-mono text-emerald-400">Gate A · OK</span>
                    </li>
                    <li className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex justify-between items-center text-white hover:border-emerald-500/50 hover:shadow-[0_0_12px_rgba(52,211,153,0.1)] transition-all">
                      <span className="font-semibold">David Beckham</span>
                      <span className="text-[10px] font-mono text-emerald-400">Gate B · OK</span>
                    </li>
                    <li className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 flex justify-between items-center text-white hover:border-amber-500/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.1)] transition-all">
                      <span className="font-semibold">Alex Rivera</span>
                      <span className="text-[10px] font-mono text-amber-400">Gate A · DUP</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Floating mobile scanner — BIG 3D */}
          <div className="hidden lg:block absolute -right-8 -bottom-8 w-72 bg-[#090d16] border-4 border-slate-700 rounded-[2.25rem] overflow-hidden"
            style={{
              transform: "perspective(600px) rotateY(-8deg) rotateX(4deg)",
              transformStyle: "preserve-3d",
              boxShadow: "0 40px 80px -20px rgba(0,0,0,0.7), 0 0 40px rgba(34,211,238,0.08), 0 0 0 1px rgba(99,102,241,0.15)",
            }}
          >
            <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center text-[10px] text-zinc-400 font-mono">
              <span className="text-emerald-400 font-bold">LIVE SCANNER</span>
              <span>Main Gate</span>
            </div>
            <div className="relative h-64 bg-black flex items-center justify-center p-4">
              <div className="w-40 h-40 border-2 border-emerald-400 rounded-2xl relative flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.25)]">
                <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_#34d399] animate-laser absolute" />
                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br" />
              </div>
              <div className="absolute inset-x-3 bottom-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500 text-center shadow-[0_0_30px_rgba(52,211,153,0.2)]">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ACCESS GRANTED</p>
                <p className="text-sm font-bold text-white mt-0.5">Michael Jordan</p>
                <p className="text-[10px] text-emerald-200">VIP Pass · Main Entrance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030712] to-transparent pointer-events-none" />
    </section>
  );
}
