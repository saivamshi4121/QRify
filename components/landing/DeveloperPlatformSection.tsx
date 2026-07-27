"use client";

import { useState } from "react";

export function DeveloperPlatformSection() {
  const [lang, setLang] = useState<"curl" | "node" | "webhook">("node");

  const codeSnippets = {
    node: `import { QrezoClient } from '@qrezo/sdk';

const qrezo = new QrezoClient({ apiKey: process.env.QREZO_API_KEY });

// Dynamically create dynamic QR destination
const qr = await qrezo.qr.create({
  workspaceId: 'ws_9910',
  name: 'VIP Entrance QR',
  targetUrl: 'https://qrezo.com/r/vip-gate',
  routing: {
    minRatingForGoogle: 4,
    googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4'
  }
});

console.log('Generated QR Image:', qr.svgUrl);`,
    curl: `curl -X POST https://api.qrezo.com/v1/scanner/access/validate \\
  -H "Authorization: Bearer qrz_live_8910a39f" \\
  -H "Content-Type: application/json" \\
  -d '{
    "token": "tk_8f91a039x",
    "gate": "Main Entrance",
    "scannerId font-mono": "scn_01"
  }'`,
    webhook: `{
  "event": "access.validated",
  "timestamp": "2026-07-27T21:00:00Z",
  "data": {
    "attendeeId": "att_89102",
    "attendeeName": "Sarah Connor",
    "gate": "Main Entrance",
    "ticketType": "VIP Pass",
    "status": "SUCCESS"
  }
}`,
  };

  return (
    <section id="developers" className="py-24 bg-[#030712] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Developer Platform & APIs
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Build QR logic right into your software.
          </h3>
          <p className="text-slate-400 text-base">
            Simple REST APIs, webhooks, and lightweight client libraries.
          </p>
        </div>

        {/* Code Explorer Box */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-[#090d16] border border-slate-800 shadow-2xl overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-[#0f172a] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-400">Qrezo Developer Hub</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(["node", "curl", "webhook"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all uppercase ${
                    lang === l ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {l === "node" ? "Node.js" : l === "curl" ? "cURL" : "Webhook"}
                </button>
              ))}
            </div>
          </div>

          {/* Code Block Content */}
          <div className="p-6 md:p-8 bg-[#090d16] overflow-x-auto">
            <pre className="text-xs sm:text-sm font-mono text-slate-200 leading-relaxed">
              <code>{codeSnippets[lang]}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
