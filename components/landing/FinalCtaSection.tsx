"use client";

import { useRef } from "react";
import Link from "next/link";
import SpecularButton from "@/components/ui/SpecularButton";
import { useInView } from "@/hooks/useInView";

export function FinalCtaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.2 });

  return (
    <section ref={ref} className="py-24 bg-[#030712] relative overflow-hidden border-t border-slate-900">
      {/* Matrix grid */}
      <div className="absolute inset-0 matrix-grid opacity-30 pointer-events-none" />

      {/* Ambient glows */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 40%, transparent 70%)",
          animation: "glow-pulse 6s ease-in-out infinite",
        }}
      />

      {/* Floating QR fragment decoration */}
      <div className="absolute top-16 left-[10%] w-16 h-16 border border-indigo-500/10 rounded-lg bg-indigo-500/[0.02] pointer-events-none"
        style={{ animation: "qr-float-1 14s ease-in-out infinite" }}
      >
        <div className="grid grid-cols-3 grid-rows-3 gap-[1px] p-1.5 h-full opacity-30">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`rounded-[1px] ${[0, 2, 4, 6, 8].includes(i) ? "bg-cyan-400/30" : "bg-indigo-500/10"}`} />
          ))}
        </div>
      </div>
      <div className="absolute bottom-20 right-[12%] w-20 h-20 border border-cyan-500/10 rounded-lg bg-cyan-500/[0.02] pointer-events-none"
        style={{ animation: "qr-float-2 12s ease-in-out 2s infinite" }}
      >
        <div className="grid grid-cols-4 grid-rows-4 gap-[1px] p-1.5 h-full opacity-30">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className={`rounded-[1px] ${[0, 3, 5, 10, 12, 15].includes(i) ? "bg-indigo-400/30" : "bg-cyan-500/10"}`} />
          ))}
        </div>
      </div>

      <div
        className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10"
        style={{
          transform: inView ? "translateY(0) translateZ(0)" : "translateY(30px) translateZ(-15px)",
          opacity: inView ? 1 : 0,
          transition: "all 0.8s cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Ready to transform how your customers interact with your business?
        </h2>

        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto">
          Deploy your first Smart QR review page or event check-in scanner in under 5 minutes. No credit card required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/signup">
            <SpecularButton
              size="lg"
              radius={14}
              tint="#ffffff"
              tintOpacity={1}
              textColor="#312e81"
              lineColor="#a5b4fc"
              baseColor="#e0e7ff"
              intensity={1.4}
              shineSize={15}
              shineFade={50}
              thickness={2}
              autoAnimate={true}
              speed={0.5}
            >
              Get Started Free Now
            </SpecularButton>
          </Link>

          <Link
            href="/login"
            className="px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10"
          >
            Sign In to Existing Account
          </Link>
        </div>
      </div>
    </section>
  );
}
