"use client";

import { useState } from "react";
import Link from "next/link";
import SpecularButton from "@/components/ui/SpecularButton";

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: "Free Starter",
      price: annual ? "0" : "0",
      desc: "For local cafes and small test projects.",
      features: [
        "1 Active Review Page",
        "Up to 500 Scans / Month",
        "Basic Google Routing",
        "Community Support",
      ],
      popular: false,
      cta: "Start Free",
      href: "/signup",
    },
    {
      name: "Pro Business",
      price: annual ? "999" : "1,299",
      period: "INR / month",
      desc: "For growing restaurants, hotels, and retail stores.",
      features: [
        "Unlimited Dynamic QR Codes",
        "Smart Review Routing & Filtering",
        "Private Feedback Email/SMS Alerts",
        "Custom Logo & Branding",
        "Full Analytics Dashboard",
        "Priority Support",
      ],
      popular: true,
      cta: "Get Started",
      href: "/signup",
    },
    {
      name: "Enterprise Events",
      price: annual ? "2,999" : "3,499",
      period: "INR / month",
      desc: "For multi-location chains and event organizers.",
      features: [
        "Mobile PWA Gate Scanner App",
        "Unlimited Staff Members & Gates",
        "Offline Scanner Check-in Queue",
        "Developer REST API & Webhooks",
        "99.99% SLA Guarantee",
        "Dedicated Success Manager",
      ],
      popular: false,
      cta: "Contact Sales",
      href: "/pricing",
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-[#030712] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Transparent SaaS Pricing
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Simple plans that scale with your business.
          </h3>
          <p className="text-slate-400 text-base">
            No hidden setup fees. Change or cancel plans anytime.
          </p>

          {/* Billing Switcher */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`text-xs font-bold ${!annual ? "text-white" : "text-slate-500"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className="w-12 h-6 rounded-full bg-slate-800 p-1 relative transition-colors border border-slate-700"
            >
              <div
                className={`w-4 h-4 rounded-full bg-indigo-500 transition-transform ${
                  annual ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1.5 ${annual ? "text-white" : "text-slate-500"}`}>
              Annual
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-3xl p-8 flex flex-col justify-between relative transition-all ${
                plan.popular
                  ? "bg-slate-900 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-[1.03]"
                  : "bg-slate-950/60 border border-slate-800"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-widest shadow-lg">
                  MOST POPULAR
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-bold text-white">{plan.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{plan.desc}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white font-mono">₹{plan.price}</span>
                  {plan.period && <span className="text-xs text-slate-400 font-medium">/{plan.period}</span>}
                </div>

                <ul className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                {plan.popular ? (
                  <Link href={plan.href} className="w-full block">
                    <SpecularButton
                      size="md"
                      radius={12}
                      tint="#4f46e5"
                      tintOpacity={0.9}
                      blur={6}
                      textColor="#ffffff"
                      lineColor="#818cf8"
                      baseColor="#3730a3"
                      intensity={1.3}
                      autoAnimate={true}
                      speed={0.4}
                      className="w-full"
                    >
                      {plan.cta}
                    </SpecularButton>
                  </Link>
                ) : (
                  <Link
                    href={plan.href}
                    className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs text-center block transition-colors"
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
