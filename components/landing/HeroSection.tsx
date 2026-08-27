"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import SpecularButton from "@/components/ui/SpecularButton";
import QRCode3D from "./QRCode3D";

function ScanLine() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 w-[1px] h-full pointer-events-none z-20">
      <div
        className="w-full h-24"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(34,211,238,0.6), transparent)",
          animation: "scan-sweep 3s ease-in-out infinite",
          boxShadow: "0 0 20px rgba(34,211,238,0.3)",
        }}
      />
    </div>
  );
}

function FloatingLabel({ text, x, y, delay }: { text: string; x: string; y: string; delay: number }) {
  return (
    <div
      className="absolute pointer-events-none z-30 hidden md:block"
      style={{ left: x, top: y, animation: `float-label 6s ease-in-out ${delay}s infinite` }}
    >
      <div className="px-3 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] backdrop-blur-sm">
        <span className="text-[11px] font-mono text-cyan-300/80 tracking-wider">{text}</span>
      </div>
    </div>
  );
}

function GridFloor() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 80%, black 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 80%, black 0%, transparent 70%)",
          transform: "perspective(500px) rotateX(60deg)",
          transformOrigin: "center bottom",
        }}
      />
    </div>
  );
}

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroOpacity = Math.max(0, 1 - scrollY / 600);
  const heroScale = 1 + scrollY * 0.0003;
  const textY = scrollY * 0.3;

  return (
    <section
      ref={containerRef}
      className="relative h-screen min-h-[700px] overflow-hidden bg-[#030712]"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 50% 40% at 50% 30%, rgba(34,211,238,0.08) 0%, rgba(99,102,241,0.04) 40%, transparent 70%)",
        }}
      />

      {/* Perspective grid floor */}
      <GridFloor />

      {/* Scan line effect */}
      <ScanLine />

      {/* Three.js 3D QR Code */}
      <div
        className="absolute inset-0 z-10"
        style={{
          opacity: heroOpacity,
          transform: `scale(${heroScale})`,
        }}
      >
        <QRCode3D />
      </div>

      {/* Floating labels */}
      <FloatingLabel text="DYNAMIC ROUTING" x="8%" y="25%" delay={0} />
      <FloatingLabel text="REAL-TIME ANALYTICS" x="75%" y="20%" delay={1.5} />
      <FloatingLabel text="GATE ACCESS" x="5%" y="70%" delay={3} />
      <FloatingLabel text="API-FIRST" x="80%" y="65%" delay={2} />

      {/* Content overlay */}
      <div
        className="absolute inset-0 z-40 flex flex-col items-center justify-center px-6"
        style={{
          opacity: heroOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        {/* Version tag */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/[0.05] backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
          </span>
          <span className="text-[11px] font-mono text-cyan-300/80 tracking-widest uppercase">v2.0 — Now Live</span>
        </div>

        {/* Main title */}
        <h1 className="text-center max-w-5xl">
          <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-[-0.04em] text-white leading-[0.95]"
            style={{
              textShadow: "0 0 80px rgba(34,211,238,0.15), 0 0 160px rgba(99,102,241,0.08)",
            }}
          >
            QREZO
          </span>
          <span className="block mt-3 text-lg sm:text-xl md:text-2xl font-light tracking-wide text-slate-300/70"
            style={{ letterSpacing: "0.25em" }}
          >
            ENTERPRISE QR MATRIX
          </span>
        </h1>

        {/* Tagline */}
        <p className="mt-8 max-w-xl text-center text-base sm:text-lg text-slate-400/80 leading-relaxed font-light">
          Programmable QR systems. Dynamic routing. Real-time analytics.
          <br className="hidden sm:block" />
          One unified dimension.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link href="/signup">
            <SpecularButton
              size="lg"
              radius={12}
              tint="#22d3ee"
              tintOpacity={0.85}
              blur={8}
              textColor="#ffffff"
              lineColor="#67e8f9"
              baseColor="#0e7490"
              intensity={1.4}
              shineSize={14}
              shineFade={45}
              thickness={1.5}
              autoAnimate={true}
              speed={0.35}
            >
              Enter the Matrix
            </SpecularButton>
          </Link>
          <a
            href="#ecosystem"
            className="group relative px-8 py-3.5 rounded-xl text-sm font-semibold text-slate-300 border border-slate-700/50 bg-slate-900/40 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/30 hover:text-white hover:bg-slate-800/50"
          >
            <span className="relative z-10">Explore Platform</span>
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.06) 0%, transparent 70%)" }}
            />
          </a>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex items-center gap-6 text-[11px] font-mono text-slate-500 tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
            NO CREDIT CARD
          </span>
          <span className="w-px h-3 bg-slate-700" />
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
            INSTANT API
          </span>
          <span className="w-px h-3 bg-slate-700" />
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.6)]" />
            99.99% UPTIME
          </span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3"
        style={{ opacity: heroOpacity }}
      >
        <span className="text-[10px] font-mono text-slate-500 tracking-[0.3em] uppercase">Scroll to explore</span>
        <div className="w-5 h-8 rounded-full border border-slate-600/50 flex items-start justify-center p-1">
          <div
            className="w-1 h-2 rounded-full bg-cyan-400"
            style={{ animation: "scroll-pulse 2s ease-in-out infinite" }}
          />
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#030712] via-[#030712]/80 to-transparent pointer-events-none z-40" />
    </section>
  );
}
