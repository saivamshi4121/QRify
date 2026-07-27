"use client";

import Link from "next/link";
import SpecularButton from "@/components/ui/SpecularButton";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden bg-[#030712]">
      {/* Ambient background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/10 to-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Version / Release Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold backdrop-blur-md hover:border-indigo-500/40 transition-colors">
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
            Qrezo v2.0 Platform Release — Smart QR & Mobile Check-in SaaS
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            The Enterprise Platform for <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
              Programmable QR Code Systems.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
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
              className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-sm transition-all backdrop-blur-md"
            >
              Explore Live Showcase
            </a>
          </div>

          {/* Trust bullet features */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-400 pt-2">
            <div>No Credit Card Required</div>
            <div>Instant API Access</div>
            <div>99.99% Uptime SLA</div>
          </div>
        </div>

        {/* Dynamic Dual-Product Mockup (Browser Dashboard + Mobile Scanner PWA) */}
        <div className="mt-16 relative max-w-5xl mx-auto">
          {/* Main Browser Window Mockup */}
          <div className="rounded-2xl border border-slate-800 bg-[#090d16] shadow-[0_0_80px_rgba(79,70,229,0.15)] overflow-hidden">
            {/* Top Window Bar */}
            <div className="px-4 py-3 bg-[#0f172a]/90 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
                <span className="ml-2 text-xs font-mono text-slate-500">app.qrezo.com/dashboard/analytics</span>
              </div>
              <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                LIVE DATA SYNCING
              </div>
            </div>

            {/* Dashboard Mock Content */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Analytics Header Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total QR Scans", val: "1,482,920", change: "+24.8%" },
                  { label: "Google Reviews Routed", val: "94,310", change: "+18.2%" },
                  { label: "Active Gate Scanners", val: "14 Devices", change: "ONLINE" },
                  { label: "Scan Latency", val: "18ms avg", change: "OPTIMAL" },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
                    <p className="text-xl md:text-2xl font-bold text-white font-mono mt-1">{stat.val}</p>
                    <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {stat.change}
                    </span>
                  </div>
                ))}
              </div>

              {/* Chart & Live Activity Feed Mock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Scan Velocity (24 Hours)</h4>
                    <span className="text-xs text-indigo-400 font-mono">14,200 Scans/hr peak</span>
                  </div>
                  {/* Visual Chart Bars */}
                  <div className="h-32 flex items-end justify-between gap-1.5 pt-4">
                    {[40, 65, 50, 85, 95, 75, 100, 80, 90, 110, 130, 95, 120, 140, 110, 150].map((h, idx) => (
                      <div
                        key={idx}
                        className="w-full bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t transition-all hover:brightness-125"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Real-time Check-ins</h4>
                  <ul className="space-y-2.5 text-xs">
                    <li className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center text-white">
                      <span className="font-semibold">Sarah Connor (VIP)</span>
                      <span className="text-[10px] font-mono text-emerald-400">Gate A • OK</span>
                    </li>
                    <li className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center text-white">
                      <span className="font-semibold">David Beckham</span>
                      <span className="text-[10px] font-mono text-emerald-400">Gate B • OK</span>
                    </li>
                    <li className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex justify-between items-center text-white">
                      <span className="font-semibold">Alex Rivera</span>
                      <span className="text-[10px] font-mono text-amber-400">Gate A • DUP</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Mobile Scanner PWA Mockup Overlay */}
          <div className="hidden lg:block absolute -right-10 -bottom-10 w-72 bg-[#090d16] border-4 border-slate-800 rounded-[2.25rem] shadow-2xl overflow-hidden">
            {/* Camera Reticle PWA Header */}
            <div className="p-3 bg-zinc-950 border-b border-zinc-900 flex justify-between items-center text-[10px] text-zinc-400 font-mono">
              <span className="text-emerald-400 font-bold">LIVE SCANNER</span>
              <span>Main Gate</span>
            </div>
            {/* Viewfinder Mock */}
            <div className="relative h-64 bg-black flex items-center justify-center p-4">
              <div className="w-40 h-40 border-2 border-emerald-400 rounded-2xl relative flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-laser absolute" />
              </div>
              <div className="absolute inset-x-3 bottom-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500 text-center">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ACCESS GRANTED</p>
                <p className="text-sm font-bold text-white mt-0.5">Michael Jordan</p>
                <p className="text-[10px] text-emerald-200">VIP Pass • Main Entrance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
