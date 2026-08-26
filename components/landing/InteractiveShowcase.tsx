"use client";

import { useState, useRef } from "react";
import { useInView } from "@/hooks/useInView";

export function InteractiveShowcase() {
  const [tab, setTab] = useState<"dashboard" | "scanner" | "reviews" | "credentials">("dashboard");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.1 });

  const tabs = [
    { id: "dashboard", label: "Admin Studio" },
    { id: "scanner", label: "Mobile Scanner" },
    { id: "reviews", label: "Review Routing" },
    { id: "credentials", label: "Event Pass" },
  ];

  return (
    <section id="showcase" ref={ref} className="py-24 bg-[#060a12] border-t border-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 matrix-grid-fine opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 space-y-12 relative z-10">
        <div
          className="text-center max-w-3xl mx-auto space-y-4"
          style={{
            transform: inView ? "translateY(0)" : "translateY(30px)",
            opacity: inView ? 1 : 0,
            transition: "all 0.8s cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Interactive Product Tour
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Built for velocity. Designed for delight.
          </h3>
          <p className="text-slate-400 text-base">
            Select a module below to inspect Qrezo&apos;s production interfaces.
          </p>
        </div>

        {/* Tab selection */}
        <div
          className="flex flex-wrap justify-center gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl max-w-xl mx-auto backdrop-blur-md"
          style={{
            transform: inView ? "translateY(0)" : "translateY(20px)",
            opacity: inView ? 1 : 0,
            transition: "all 0.8s cubic-bezier(0.23,1,0.32,1) 0.15s",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                tab === t.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Interactive mockup with 3D perspective */}
        <div
          className="max-w-4xl mx-auto rounded-3xl p-6 sm:p-8 relative overflow-hidden min-h-[420px] flex items-center justify-center"
          style={{
            perspective: "1200px",
            background: "linear-gradient(145deg, #0c1020, #090d16)",
            border: "1px solid rgba(99,102,241,0.2)",
            boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5), 0 0 60px rgba(99,102,241,0.08), 0 0 0 1px rgba(99,102,241,0.1)",
            transform: inView ? "translateY(0) rotateX(2deg)" : "translateY(40px) rotateX(5deg)",
            opacity: inView ? 1 : 0,
            transition: "all 0.8s cubic-bezier(0.23,1,0.32,1) 0.3s",
          }}
        >
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            <div
              className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"
              style={{ animation: "scanline 6s linear infinite" }}
            />
          </div>

          {tab === "dashboard" && (
            <div key="dashboard" className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-white">Main Event Workspace</h4>
                  <p className="text-xs text-slate-400">Workspace ID: ws_8f391a · Realtime Sync</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-colors">
                  Create Smart QR
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Total Scans Today", val: "42,890", change: "+14% vs yesterday", changeClass: "text-emerald-400" },
                  { label: "Active Gates", val: "8/8 Online", change: "All synchronized", changeClass: "text-emerald-400" },
                  { label: "Average Check-in", val: "0.14 sec", change: "Ultra Low Latency", changeClass: "text-indigo-400" },
                ].map((s, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 transition-colors">
                    <p className="text-xs text-slate-400">{s.label}</p>
                    <p className="text-2xl font-bold text-white font-mono mt-1">{s.val}</p>
                    <span className={`text-[10px] font-semibold ${s.changeClass}`}>{s.change}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-300">
                <span className="font-mono text-indigo-400">qr.qrezo.com/r/main-gate</span>
                <span className="text-slate-400">→ https://reviews.google.com/place/10928</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">Active</span>
              </div>
            </div>
          )}

          {tab === "scanner" && (
            <div key="scanner" className="w-full max-w-sm mx-auto bg-black border-4 border-slate-800 rounded-[2rem] p-4 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 border-b border-zinc-900 pb-2">
                <span className="text-emerald-400 font-bold">SCANNER PWA ONLINE</span>
                <span>Gate A</span>
              </div>
              <div className="w-full h-48 border-2 border-emerald-400/80 rounded-xl relative flex items-center justify-center bg-zinc-950 overflow-hidden">
                <div className="w-32 h-32 border border-emerald-500/50 rounded-lg relative">
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-laser absolute" />
                </div>
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400/60 rounded-tl" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400/60 rounded-tr" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400/60 rounded-bl" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400/60 rounded-br" />
              </div>
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/60 text-center">
                <p className="text-[10px] font-black text-emerald-400 uppercase">ACCESS GRANTED</p>
                <p className="text-base font-extrabold text-white">Elon Musk</p>
                <p className="text-[10px] text-emerald-200">VIP Pass · Ticket #9910</p>
              </div>
            </div>
          )}

          {tab === "reviews" && (
            <div key="reviews" className="w-full max-w-md mx-auto space-y-4 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500 text-indigo-400 font-bold text-sm flex items-center justify-center mx-auto font-mono">
                BT
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Bella Trattoria Restaurant</h4>
                <p className="text-xs text-slate-400">How was your dining experience today?</p>
              </div>
              <div className="flex justify-center gap-2 py-2">
                <span className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-bold font-mono">
                  RATING: 5.0 / 5.0
                </span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-left space-y-1">
                <p className="font-bold">High Rating Routing Triggered</p>
                <p className="text-[11px] text-emerald-200/80">Guest gave 5 stars — redirected straight to Google Review form.</p>
              </div>
            </div>
          )}

          {tab === "credentials" && (
            <div key="credentials" className="w-full max-w-sm mx-auto rounded-2xl p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-300"
              style={{ background: "linear-gradient(to bottom, rgba(49,46,129,0.3), rgba(9,13,22,1))", border: "1px solid rgba(99,102,241,0.3)" }}
            >
              <div className="flex justify-between items-center text-xs text-indigo-300 font-mono">
                <span>QREZO DIGITAL PASS</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20">VERIFIED</span>
              </div>
              <div className="py-2">
                <h4 className="text-xl font-black text-white">Global Tech Summit 2026</h4>
                <p className="text-xs text-slate-400">San Francisco Bay Arena</p>
              </div>
              <div className="bg-white p-3 rounded-xl w-36 h-36 mx-auto flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded border border-slate-800 p-2 flex flex-col items-center justify-center font-mono text-[9px] text-indigo-400">
                  <span>DYNAMIC</span>
                  <span>PASS QR</span>
                  <span className="text-white mt-1">#9920-X8</span>
                </div>
              </div>
              <div className="text-xs font-mono text-slate-300">
                <p className="font-bold text-white">ATTENDEE: Alex Rivera</p>
                <p className="text-[10px] text-slate-400">PASS ID: PASS-9920-X8</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
