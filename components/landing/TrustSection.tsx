"use client";

export function TrustSection() {
  const logos = [
    "RESTAURANTS GROUP",
    "HYATT HOTELS",
    "METRO CONFERENCES",
    "GLOBAL EVENTS INC",
    "APEX HEALTHCARE",
    "LUXURY HOSPITALITY",
  ];

  const stats = [
    { value: "250M+", label: "QR Scans Processed" },
    { value: "< 20ms", label: "Global Edge Latency" },
    { value: "99.99%", label: "Uptime SLA Guarantee" },
    { value: "180+", label: "Countries Supported" },
  ];

  return (
    <section className="py-16 bg-[#060a12] border-y border-slate-900">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Customer Logo Ticker */}
        <div className="text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Trusted by fast-growing enterprises & top hospitality brands
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all">
            {logos.map((logo, i) => (
              <span key={i} className="text-sm md:text-base font-black tracking-wider text-slate-400 font-mono">
                {logo}
              </span>
            ))}
          </div>
        </div>

        {/* Enterprise Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-900">
          {stats.map((s, idx) => (
            <div key={idx} className="text-center space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-white font-mono bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                {s.value}
              </p>
              <p className="text-xs font-semibold text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
