"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import SpecularButton from "@/components/ui/SpecularButton";
import { useInView } from "@/hooks/useInView";

export function FinalCtaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.15 });
  const [mouseX, setMouseX] = useState(0);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMouseX((e.clientX / window.innerWidth - 0.5) * 2);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <section ref={ref} className="py-32 bg-[#030712] relative overflow-hidden">
      {/* Dramatic ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(99,102,241,0.12) 0%, rgba(34,211,238,0.06) 40%, transparent 70%)",
          animation: "glow-pulse 6s ease-in-out infinite",
        }}
      />

      {/* Perspective grid floor */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse 60% 40% at 50% 100%, black 0%, transparent 60%)",
        WebkitMaskImage: "radial-gradient(ellipse 60% 40% at 50% 100%, black 0%, transparent 60%)",
        transform: "perspective(500px) rotateX(60deg)",
        transformOrigin: "center bottom",
      }} />

      {/* Floating QR grid fragments */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute pointer-events-none opacity-20"
          style={{
            width: `${40 + i * 12}px`,
            height: `${40 + i * 12}px`,
            left: `${10 + i * 15}%`,
            top: `${15 + (i % 3) * 25}%`,
            border: "1px solid rgba(99,102,241,0.15)",
            borderRadius: "8px",
            background: "rgba(99,102,241,0.03)",
            animation: `qr-float-${(i % 3) + 1} ${10 + i * 2}s ease-in-out ${i * 0.5}s infinite`,
          }}
        >
          <div className="grid grid-cols-3 grid-rows-3 gap-[1px] p-1 h-full">
            {[...Array(9)].map((_, j) => (
              <div
                key={j}
                className="rounded-[1px]"
                style={{
                  background: [0, 2, 4, 6, 8].includes(j)
                    ? `rgba(99,102,241,${0.2 + (j * 0.017)})`
                    : "rgba(34,211,238,0.05)",
                }}
              />
            ))}
          </div>
        </div>
      ))}

      <div
        className="max-w-5xl mx-auto px-6 text-center relative z-10"
        style={{
          transform: `perspective(1200px) rotateY(${mouseX * 3}deg) ${inView ? "translateY(0) translateZ(0)" : "translateY(50px) translateZ(-30px)"}`,
          opacity: inView ? 1 : 0,
          transition: "all 1.2s cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        {/* Large decorative QR code */}
        <div className="flex justify-center mb-10">
          <div
            className="w-24 h-24 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-2"
            style={{
              boxShadow: "0 0 40px rgba(34,211,238,0.1), inset 0 0 20px rgba(99,102,241,0.05)",
              animation: "qr-float-1 8s ease-in-out infinite",
            }}
          >
            <div className="grid grid-cols-5 grid-rows-5 gap-[2px] h-full">
              {[1,1,1,1,1, 1,0,0,0,1, 1,0,1,0,1, 1,0,0,0,1, 1,1,1,1,1].map((filled, i) => (
                <div
                  key={i}
                  className="rounded-[1px]"
                  style={{
                    background: filled
                      ? "linear-gradient(135deg, rgba(34,211,238,0.6), rgba(99,102,241,0.4))"
                      : "rgba(255,255,255,0.02)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.05]">
          Enter the
          <br />
          <span
            className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent"
            style={{ textShadow: "0 0 60px rgba(99,102,241,0.15)" }}
          >
            QR Dimension
          </span>
        </h2>

        <p className="mt-8 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Deploy your first Smart QR review page or event check-in scanner in under 5 minutes.
          <br className="hidden sm:block" />
          No credit card required. No strings attached.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link href="/signup">
            <SpecularButton
              size="lg"
              radius={14}
              tint="#22d3ee"
              tintOpacity={0.9}
              textColor="#0e7490"
              lineColor="#67e8f9"
              baseColor="#ecfeff"
              intensity={1.4}
              shineSize={15}
              shineFade={50}
              thickness={2}
              autoAnimate={true}
              speed={0.45}
            >
              Start Building Free
            </SpecularButton>
          </Link>

          <Link
            href="/login"
            className="group relative px-8 py-4 rounded-xl text-sm font-bold text-slate-300 border border-slate-700/40 bg-slate-900/30 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/30 hover:text-white"
          >
            <span className="relative z-10">Sign In</span>
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.06) 0%, transparent 70%)" }}
            />
          </Link>
        </div>

        {/* Trust line */}
        <div className="mt-14 flex items-center justify-center gap-8 text-[11px] font-mono text-slate-600 tracking-wider">
          <span>99.99% UPTIME</span>
          <span className="w-px h-3 bg-slate-700" />
          <span>SOC 2 READY</span>
          <span className="w-px h-3 bg-slate-700" />
          <span>GDPR COMPLIANT</span>
        </div>
      </div>
    </section>
  );
}
