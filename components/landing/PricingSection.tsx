"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import SpecularButton from "@/components/ui/SpecularButton";
import { useInView } from "@/hooks/useInView";

export function PricingSection() {
  const [annual, setAnnual] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.1 });
  const [mouseX, setMouseX] = useState(0);

  const plans = [
    {
      name: "Free Starter",
      price: annual ? "0" : "0",
      period: "",
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
      accent: "#64748b",
      accentBg: "rgba(100,116,139,0.08)",
    },
    {
      name: "Pro Business",
      price: annual ? "999" : "1,299",
      period: "INR / month",
      desc: "For growing restaurants, hotels, and retail.",
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
      accent: "#818cf8",
      accentBg: "rgba(99,102,241,0.1)",
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
      accent: "#22d3ee",
      accentBg: "rgba(34,211,238,0.08)",
    },
  ];

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMouseX((e.clientX / window.innerWidth - 0.5) * 2);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <section id="pricing" ref={ref} className="py-32 bg-[#030712] relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)" }}
      />

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px",
        maskImage: "radial-gradient(ellipse 60% 40% at 50% 60%, black 0%, transparent 60%)",
        WebkitMaskImage: "radial-gradient(ellipse 60% 40% at 50% 60%, black 0%, transparent 60%)",
      }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div
          className="text-center max-w-3xl mx-auto space-y-5 mb-16"
          style={{
            transform: inView ? "translateY(0)" : "translateY(40px)",
            opacity: inView ? 1 : 0,
            transition: "all 0.9s cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/[0.06]">
            <span className="text-[10px] font-mono text-purple-300/80 tracking-widest uppercase">Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Simple plans that
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              scale with you.
            </span>
          </h2>
          <p className="text-slate-400 text-base">
            No hidden fees. Change or cancel anytime.
          </p>

          {/* Billing toggle — premium style */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <span className={`text-xs font-bold transition-colors duration-300 ${!annual ? "text-white" : "text-slate-500"}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative w-14 h-7 rounded-full transition-all duration-500"
              style={{
                background: annual
                  ? "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.3))"
                  : "rgba(30,41,59,0.8)",
                border: `1px solid ${annual ? "rgba(99,102,241,0.4)" : "rgba(51,65,85,0.5)"}`,
                boxShadow: annual ? "0 0 20px rgba(99,102,241,0.15)" : "none",
              }}
            >
              <div
                className="absolute top-0.5 w-6 h-6 rounded-full transition-all duration-500"
                style={{
                  left: annual ? "30px" : "2px",
                  background: annual
                    ? "linear-gradient(135deg, #818cf8, #a78bfa)"
                    : "rgba(148,163,184,0.6)",
                  boxShadow: annual ? "0 0 12px rgba(99,102,241,0.4)" : "none",
                }}
              />
            </button>
            <span className={`text-xs font-bold flex items-center gap-2 transition-colors duration-300 ${annual ? "text-white" : "text-slate-500"}`}>
              Annual
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase"
                style={{
                  background: annual ? "rgba(52,211,153,0.15)" : "rgba(52,211,153,0.05)",
                  color: annual ? "#34d399" : "rgba(52,211,153,0.4)",
                  border: `1px solid ${annual ? "rgba(52,211,153,0.3)" : "rgba(52,211,153,0.1)"}`,
                }}
              >
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* 3D Pricing Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch"
          style={{
            perspective: "1400px",
            transform: `rotateY(${mouseX * 2}deg)`,
            transition: "transform 0.5s cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          {plans.map((plan, i) => {
            const rotateY = (i - 1) * 5;
            const isPopular = plan.popular;
            const translateZ = isPopular ? 30 : -10;
            const scale = isPopular ? 1.06 : 1;

            return (
              <div
                key={i}
                className="group relative"
                style={{
                  transform: inView
                    ? `perspective(1000px) rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(${scale})`
                    : `perspective(1000px) rotateY(${rotateY}deg) translateZ(-80px) rotateX(8deg) scale(0.95)`,
                  opacity: inView ? 1 : 0,
                  transition: `all 1s cubic-bezier(0.23,1,0.32,1) ${0.15 + i * 0.15}s`,
                  transformStyle: "preserve-3d",
                  zIndex: isPopular ? 10 : 1,
                }}
              >
                {/* Card face */}
                <div
                  className="relative rounded-2xl p-8 h-full flex flex-col"
                  style={{
                    background: isPopular
                      ? "linear-gradient(160deg, #151b35 0%, #0d1025 100%)"
                      : "linear-gradient(160deg, #0d1225 0%, #080c18 100%)",
                    border: isPopular ? "1.5px solid rgba(99,102,241,0.35)" : "1px solid rgba(51,65,85,0.25)",
                    boxShadow: isPopular
                      ? "0 50px 100px -20px rgba(99,102,241,0.25), 0 0 80px rgba(99,102,241,0.08), 0 0 0 1px rgba(99,102,241,0.15)"
                      : "0 25px 50px -15px rgba(0,0,0,0.5), 0 0 30px rgba(0,0,0,0.2)",
                  }}
                >
                  {/* Top glow line for popular */}
                  {isPopular && (
                    <div className="absolute top-0 left-6 right-6 h-px"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(129,140,248,0.6), transparent)" }}
                    />
                  )}

                  {/* Hover radial glow */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 0%, ${plan.accentBg} 0%, transparent 50%)`,
                    }}
                  />

                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                      <div
                        className="px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                        style={{
                          background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                          color: "white",
                          boxShadow: "0 8px 24px rgba(79,70,229,0.35), 0 0 0 1px rgba(129,140,248,0.3)",
                        }}
                      >
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  <div className="relative z-10 space-y-6 flex-1">
                    {/* Plan name */}
                    <div>
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-400 mt-1.5">{plan.desc}</p>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className="text-5xl font-black font-mono tracking-tight"
                        style={{
                          color: isPopular ? "#c7d2fe" : "white",
                          textShadow: isPopular ? "0 0 30px rgba(99,102,241,0.2)" : "none",
                        }}
                      >
                        ₹{plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-xs text-slate-500 font-medium">/{plan.period}</span>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 pt-5 border-t border-slate-800/50">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background: plan.accent,
                              boxShadow: `0 0 6px ${plan.accentBg}`,
                            }}
                          />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="relative z-10 pt-8">
                    {isPopular ? (
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
                        className="w-full py-3.5 rounded-xl font-bold text-xs text-center block transition-all duration-300"
                        style={{
                          background: "rgba(15,23,42,0.6)",
                          border: "1px solid rgba(51,65,85,0.3)",
                          color: "white",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = `${plan.accent}40`;
                          e.currentTarget.style.boxShadow = `0 0 20px ${plan.accentBg}`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "rgba(51,65,85,0.3)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {plan.cta}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
