"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

function NavItem({
  label,
  href,
  index,
}: {
  label: string;
  href: string;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 cursor-pointer"
      style={{
        color: hovered ? "#ffffff" : "#94a3b8",
        textShadow: hovered ? "0 0 20px rgba(99,102,241,0.6), 0 0 40px rgba(34,211,238,0.3)" : "none",
      }}
    >
      {/* Cell background on hover */}
      <span
        className="absolute inset-0 rounded-md transition-all duration-300"
        style={{
          background: hovered
            ? "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.1))"
            : "transparent",
          border: hovered ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
          boxShadow: hovered ? "0 0 20px rgba(99,102,241,0.1), inset 0 0 20px rgba(99,102,241,0.05)" : "none",
        }}
      />

      {/* Corner markers on hover */}
      {hovered && (
        <>
          <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-cyan-400/60 rounded-tl" />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-cyan-400/60 rounded-tr" />
          <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-cyan-400/60 rounded-bl" />
          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-cyan-400/60 rounded-br" />
        </>
      )}

      <span className="relative z-10">{label}</span>

      {/* Index number */}
      <span
        className="absolute -top-1 -right-1 text-[7px] font-mono transition-all duration-300"
        style={{
          color: hovered ? "rgba(34,211,238,0.8)" : "rgba(99,102,241,0.2)",
        }}
      >
        {String(index).padStart(2, "0")}
      </span>
    </a>
  );
}

export function LandingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mouse glow tracker
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (!navRef.current) return;
      const rect = navRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const navLinks = [
    { label: "Products", href: "#ecosystem" },
    { label: "Solutions", href: "#solutions" },
    { label: "Developers", href: "#developers" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  const authLinks = [
    { label: "Sign In", href: "/login" },
    { label: "Get Started", href: "/signup" },
  ];

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) setIsMobileMenuOpen(false);
    },
    [isMobileMenuOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* DESKTOP HEADER */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none pt-4 md:pt-5"
        suppressHydrationWarning
      >
        <div
          ref={navRef}
          className="hidden md:flex items-center gap-1 pointer-events-auto relative"
          style={{
            transition: "all 0.6s cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          {/* Animated border glow */}
          <div
            className="absolute -inset-[1px] rounded-full opacity-60"
            style={{
              background: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, rgba(99,102,241,0.4), rgba(34,211,238,0.2), transparent)`,
              filter: "blur(0.5px)",
              transition: "background 0.3s ease",
            }}
          />

          {/* Outer glow ring */}
          <div
            className="absolute -inset-[1px] rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(34,211,238,0.2), rgba(167,139,250,0.3), rgba(99,102,241,0.2))",
              backgroundSize: "300% 300%",
              animation: "gradient-shift 8s ease infinite",
              filter: "blur(1px)",
              opacity: scrolled ? 0.8 : 0.5,
            }}
          />

          {/* Main nav body */}
          <div
            className="relative flex items-center gap-1 rounded-full px-2 py-1.5"
            style={{
              background: scrolled
                ? "rgba(3,7,18,0.95)"
                : "rgba(3,7,18,0.85)",
              backdropFilter: "blur(24px) saturate(1.8)",
              WebkitBackdropFilter: "blur(24px) saturate(1.8)",
              boxShadow: scrolled
                ? "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.03)"
                : "0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.02)",
              transition: "all 0.6s cubic-bezier(0.23,1,0.32,1)",
            }}
          >
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full mr-1 group relative"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.08))",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              {/* Logo glow */}
              <span
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)",
                  filter: "blur(8px)",
                }}
              />
              <span className="relative w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-mono text-[11px] font-black shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                Q
              </span>
              <span className="relative font-mono text-sm font-extrabold text-white tracking-widest">
                QREZO
                <span className="text-cyan-400" style={{ textShadow: "0 0 10px rgba(34,211,238,0.5)" }}>.</span>
              </span>
            </Link>

            {/* Divider */}
            <div className="w-px h-6 bg-gradient-to-b from-transparent via-indigo-500/30 to-transparent mx-1" />

            {/* Nav items */}
            {navLinks.map((item, i) => (
              <NavItem key={item.href} label={item.label} href={item.href} index={i + 1} />
            ))}

            {/* Divider */}
            <div className="w-px h-6 bg-gradient-to-b from-transparent via-indigo-500/30 to-transparent mx-1" />

            {/* Auth buttons */}
            <Link
              href="/login"
              className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors duration-300 rounded-md hover:bg-white/[0.03]"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="relative px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-white rounded-full overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #0891b2)",
                boxShadow: "0 0 20px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                }}
              />
              <span className="relative z-10">Get Started</span>
            </Link>
          </div>
        </div>

        {/* MOBILE TOP BAR */}
        <div
          className="flex md:hidden items-center justify-between w-full max-w-sm h-12 rounded-full px-4 pointer-events-auto relative"
          style={{
            background: "rgba(3,7,18,0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(99,102,241,0.2)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 30px rgba(99,102,241,0.05)",
          }}
        >
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-mono text-xs font-black shadow-[0_0_12px_rgba(99,102,241,0.4)]">
              Q
            </div>
            <span className="font-mono text-sm font-extrabold text-white tracking-wider">
              QREZO<span className="text-cyan-400">.</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-9 h-9 rounded-full flex flex-col items-center justify-center gap-1.5 text-slate-300 hover:text-white transition-all cursor-pointer relative group"
            aria-label="Open navigation menu"
          >
            <span className="absolute inset-0 rounded-full bg-indigo-500/10 border border-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative w-4 h-[1.5px] bg-current rounded-full" />
            <span className="relative w-3 h-[1.5px] bg-current rounded-full" />
            <span className="relative w-4 h-[1.5px] bg-current rounded-full" />
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mounted && isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] cursor-pointer"
              aria-hidden="true"
            />
            <motion.div
              initial={{ y: "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 200 }}
              className="fixed inset-x-0 top-0 z-[101] max-h-[85vh] rounded-b-3xl flex flex-col overflow-y-auto"
              style={{
                background: "linear-gradient(180deg, rgba(3,7,18,0.98), rgba(9,13,22,0.98))",
                backdropFilter: "blur(30px)",
                border: "1px solid rgba(99,102,241,0.15)",
                borderBottom: "none",
                boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.08)",
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Menu"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
                <Link href="/" className="flex items-center gap-2.5" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-mono text-xs font-black shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                    Q
                  </div>
                  <span className="font-mono text-base font-extrabold text-white tracking-wider">
                    QREZO<span className="text-cyan-400">.</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Nav links — matrix grid style */}
              <div className="p-5 space-y-2">
                {navLinks.map((item, idx) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl text-slate-200 hover:text-white transition-all group"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(99,102,241,0.08)",
                    }}
                  >
                    <span className="text-[10px] font-mono text-indigo-400/50 group-hover:text-cyan-400 transition-colors">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-bold">{item.label}</span>
                    <span className="ml-auto text-slate-600 group-hover:text-indigo-400 transition-colors text-xs font-mono">→</span>
                  </a>
                ))}
              </div>

              {/* Auth section */}
              <div className="p-5 border-t border-slate-800/80 space-y-3 mt-auto">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center min-h-[48px] w-full py-3 px-4 rounded-xl border border-slate-800/80 text-sm font-bold text-slate-200 hover:text-white hover:bg-slate-900 transition-all text-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center min-h-[48px] w-full py-3 px-4 rounded-xl text-sm font-bold text-white transition-all text-center"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5, #0891b2)",
                    boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                  }}
                >
                  Get Started Free
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gradient shift keyframes */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </>
  );
}
