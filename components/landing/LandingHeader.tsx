"use client";

import Link from "next/link";
import PillNav from "@/components/ui/PillNav";

export function LandingHeader() {
  const navItems = [
    { label: "Products", href: "#ecosystem" },
    { label: "Solutions", href: "#solutions" },
    { label: "Developers", href: "#developers" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
    { label: "Sign In", href: "/login" },
    { label: "Get Started", href: "/signup" },
  ];

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto">
        <PillNav
          logo={
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-mono text-[10px] font-black">
              Q
            </div>
          }
          logoAlt="Qrezo Logo"
          items={navItems}
          baseColor="#4f46e5"
          pillColor="#090d16"
          pillTextColor="#cbd5e1"
          hoveredPillTextColor="#ffffff"
          ease="power3.easeOut"
          initialLoadAnimation={true}
        />
      </div>
    </header>
  );
}
