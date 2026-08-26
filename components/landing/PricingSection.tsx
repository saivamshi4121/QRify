"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import SpecularButton from "@/components/ui/SpecularButton";
import { useInView } from "@/hooks/useInView";

export function PricingSection() {
  const [annual, setAnnual] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.1 });

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
    <section id="pricing" ref={ref} className="py-24 bg-[#030712] relative overflow-hidden">
      <div className="absolute inset-0 matrix-grid opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 space-y-16 relative z-10">
        <div
          className="text-center max-w-3xl mx-auto space-y-4"
          style={{
            transform: inView ? "translateY(0)" : "translateY(30px)",
            opacity: inView ? 1 : 0,
            transition: "all 0.8s cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Transparent SaaS Pricing
          </h2>
          <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Simple plans that scale with your business.
          </h3>
          <p className="text-slate-400 text-base">
            No hidden setup fees. Change or cancel plans anytime.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`text-xs font-bold transition-colors ${!annual ? "text-white" : "text-slate-500"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className="w-12 h-6 rounded-full bg-slate-800 p-1 relative transition-colors border border-slate-700 hover:border-indigo-500/50"
            >
              <div
                className={`w-4 h-4 rounded-full bg-indigo-500 transition-transform duration-300 shadow-lg shadow-indigo-500/30 ${
                  annual ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${annual ? "text-white" : "text-slate-500"}`}>
              Annual
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing cards with DRAMATIC 3D */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch" style={{ perspective: "1200px" }}>
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-500 ${
                plan.popular
                  ? "border-2 border-indigo-500 md:scale-[1.05] z-10"
                  : "border border-slate-800"
              }`}
              style={{
                background: plan.popular
                  ? "linear-gradient(145deg, #131830, #0c1020)"
                  : "linear-gradient(145deg, #0c1020, #090d16)",
                boxShadow: plan.popular
                  ? "0 40px 80px -15px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.12), 0 0 0 1px rgba(99,102,241,0.2)"
                  : "0 20px 40px -15px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.03)",
                transform: inView
                  ? `perspective(800px) rotateY(${(i - 1) * 4}deg) translateZ(0)`
                  : `perspective(800px) rotateY(${(i - 1) * 4}deg) translateZ(-40px)`,
                opacity: inView ? 1 : 0,
                transition: `all 0.8s cubic-bezier(0.23,1,0.32,1) ${0.2 + i * 0.12}s`,
              }}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/30">
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
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
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
                    className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs text-center block transition-colors hover:border-indigo-500/30"
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
