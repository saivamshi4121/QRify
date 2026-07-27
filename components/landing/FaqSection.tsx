"use client";

import { useState } from "react";

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does Google Review routing work?",
      a: "Guests scan your QR code and select a star rating. High ratings (e.g. 4 or 5 stars) are instantly forwarded to your Google Business review page. Lower ratings open a private feedback form so you can address issues directly.",
    },
    {
      q: "Can I change where a printed QR code points?",
      a: "Yes! All Qrezo QR codes are dynamic. You can modify destination URLs, swap review pages, or enable time-of-day routing anytime from your dashboard without reprinting your physical QR cards or table tents.",
    },
    {
      q: "How does the Mobile Gate Scanner work for events?",
      a: "The Scanner is a zero-install Progressive Web App (PWA). Staff members log in on their mobile browser, pick their gate, and scan attendee QR tickets using their phone camera with sub-second validation.",
    },
    {
      q: "What happens if internet connectivity drops at an event?",
      a: "Our scanner app features offline queueing capability. Check-in operations continue uninterrupted locally, and scan records automatically sync back to the cloud as soon as connection restores.",
    },
    {
      q: "Are there API limits or developer SDKs available?",
      a: "Yes! Qrezo offers official Node.js and Python SDKs along with REST endpoints and real-time webhook triggers for custom enterprise software integrations.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-[#060a12] border-t border-slate-900">
      <div className="max-w-4xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Frequently Asked Questions
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything you need to know about Qrezo.
          </h3>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#090d16] border border-slate-800/80 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full p-6 text-left flex justify-between items-center gap-4 text-base font-bold text-white hover:text-indigo-300 transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-xl font-mono text-indigo-400 shrink-0">
                  {openIdx === idx ? "−" : "+"}
                </span>
              </button>

              {openIdx === idx && (
                <div className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-slate-900 pt-4 animate-in fade-in duration-150">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
