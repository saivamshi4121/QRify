"use client";

import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="bg-[#030712] border-t border-slate-900 pt-16 pb-12 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Column 1: Brand & Newsletter */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 font-mono text-lg font-black text-white">
              <span className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold">
                Q
              </span>
              QREZO<span className="text-indigo-500">.</span>
            </Link>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              The programmable Smart QR and mobile event check-in platform for local businesses and modern enterprises.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 max-w-xs pt-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shrink-0 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* Column 2: Products */}
          <div className="space-y-3">
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Products</h5>
            <ul className="space-y-2">
              <li><a href="#ecosystem" className="hover:text-white transition-colors">Smart QR Engine</a></li>
              <li><a href="#ecosystem" className="hover:text-white transition-colors">Review Routing</a></li>
              <li><a href="#ecosystem" className="hover:text-white transition-colors">Mobile Scanner PWA</a></li>
              <li><a href="#ecosystem" className="hover:text-white transition-colors">Digital Event Credentials</a></li>
              <li><a href="#ecosystem" className="hover:text-white transition-colors">Real-time Telemetry</a></li>
            </ul>
          </div>

          {/* Column 3: Solutions */}
          <div className="space-y-3">
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Solutions</h5>
            <ul className="space-y-2">
              <li><a href="#solutions" className="hover:text-white transition-colors">Restaurants & Cafés</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Hotels & Hospitality</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Live Events & Stadiums</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Healthcare & Clinics</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Retail & Showrooms</a></li>
            </ul>
          </div>

          {/* Column 4: Developers & Legal */}
          <div className="space-y-3">
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Developers & Legal</h5>
            <ul className="space-y-2">
              <li><a href="#developers" className="hover:text-white transition-colors">REST API Docs</a></li>
              <li><a href="#developers" className="hover:text-white transition-colors">Node.js SDK</a></li>
              <li><a href="#developers" className="hover:text-white transition-colors">Webhooks</a></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Qrezo Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 font-mono">
            <span>STATUS: 99.99% ONLINE</span>
            <span>•</span>
            <span>EDGE LATENCY: &lt;20MS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
