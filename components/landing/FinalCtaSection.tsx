"use client";

import Link from "next/link";
import SpecularButton from "@/components/ui/SpecularButton";

export function FinalCtaSection() {
  return (
    <section className="py-24 bg-[#030712] relative overflow-hidden border-t border-slate-900">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-indigo-600/30 to-purple-600/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
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
            className="px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm transition-colors"
          >
            Sign In to Existing Account
          </Link>
        </div>
      </div>
    </section>
  );
}
