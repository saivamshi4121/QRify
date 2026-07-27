"use client";

import { useState } from "react";

export function InteractiveShowcase() {
  const [tab, setTab] = useState<"dashboard" | "scanner" | "reviews" | "credentials">("dashboard");

  return (
    <section id="showcase" className="py-24 bg-[#060a12] border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
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

        {/* Tab Selection */}
        <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl max-w-xl mx-auto backdrop-blur-md">
          {[
            { id: "dashboard", label: "Admin Studio" },
            { id: "scanner", label: "Mobile Scanner" },
            { id: "reviews", label: "Review Routing" },
            { id: "credentials", label: "Event Pass" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === t.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Interactive Mockup Display Box */}
        <div className="max-w-4xl mx-auto bg-[#090d16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden min-h-[420px] flex items-center justify-center">
          {tab === "dashboard" && (
            <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-white">Main Event Workspace</h4>
                  <p className="text-xs text-slate-400">Workspace ID: ws_8f391a • Realtime Sync</p>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs">
                  Create Smart QR
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-xs text-slate-400">Total Scans Today</p>
                  <p className="text-2xl font-bold text-white font-mono mt-1">42,890</p>
                  <span className="text-[10px] text-emerald-400 font-semibold">+14% vs yesterday</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-xs text-slate-400">Active Gates</p>
                  <p className="text-2xl font-bold text-white font-mono mt-1">8/8 Online</p>
                  <span className="text-[10px] text-emerald-400 font-semibold">All synchronized</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-xs text-slate-400">Average Check-in</p>
                  <p className="text-2xl font-bold text-white font-mono mt-1">0.14 sec</p>
                  <span className="text-[10px] text-indigo-400 font-semibold">Ultra Low Latency</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center text-xs text-slate-300">
                <span className="font-mono text-indigo-400">qr.qrezo.com/r/main-gate</span>
                <span className="text-slate-400">Redirects to: https://reviews.google.com/place/10928</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">Active</span>
              </div>
            </div>
          )}

          {tab === "scanner" && (
            <div className="w-full max-w-sm mx-auto bg-black border-4 border-slate-800 rounded-[2rem] p-4 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 border-b border-zinc-900 pb-2">
                <span className="text-emerald-400 font-bold">SCANNER PWA ONLINE</span>
                <span>Gate A</span>
              </div>
              <div className="w-full h-48 border-2 border-emerald-400 rounded-xl relative flex items-center justify-center bg-zinc-950">
                <div className="w-32 h-32 border border-emerald-500/50 rounded-lg relative">
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-laser absolute" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500 text-center">
                <p className="text-[10px] font-black text-emerald-400 uppercase">ACCESS GRANTED</p>
                <p className="text-base font-extrabold text-white">Elon Musk</p>
                <p className="text-[10px] text-emerald-200">VIP Pass • Ticket #9910</p>
              </div>
            </div>
          )}

          {tab === "reviews" && (
            <div className="w-full max-w-md mx-auto space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
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
            <div className="w-full max-w-sm mx-auto bg-gradient-to-b from-indigo-950 to-slate-950 border border-indigo-500/40 rounded-2xl p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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
