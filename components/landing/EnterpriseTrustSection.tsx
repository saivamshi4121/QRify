"use client";

export function EnterpriseTrustSection() {
  const trustPoints = [
    {
      title: "Enterprise Grade Security",
      desc: "End-to-end tokenized QR credentials with encrypted validation payload headers.",
      badge: "SECURITY",
    },
    {
      title: "Sub-20ms Global Routing",
      desc: "Distributed edge network ensures instantaneous destination resolution across all continents.",
      badge: "VELOCITY",
    },
    {
      title: "SOC2 & GDPR Compliance",
      desc: "Built to stringent data privacy guidelines with optional data retention policies.",
      badge: "COMPLIANCE",
    },
    {
      title: "Offline Camera PWA Sync",
      desc: "Scanners continue checking in attendees during network drops and sync as soon as connectivity resumes.",
      badge: "OFFLINE SYNC",
    },
    {
      title: "Granular Multi-Gate RBAC",
      desc: "Assign staff members to specific gates, events, or workspaces with restricted permissions.",
      badge: "PERMISSIONS",
    },
    {
      title: "Real-time Telemetry & Alerts",
      desc: "Instant SMS & Email triggers for unexpected scan failures or low rating submissions.",
      badge: "TELEMETRY",
    },
  ];

  return (
    <section className="py-24 bg-[#060a12] border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Enterprise Architecture
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Security & performance built-in from day one.
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustPoints.map((item, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 inline-block">
                {item.badge}
              </span>
              <h4 className="text-base font-bold text-white">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
