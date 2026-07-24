"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#templates", label: "Templates" },
  { href: "#analytics", label: "Analytics" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-indigo-600">
          Qrezo
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-indigo-600"
            >
              {link.label}
            </a>
          ))}
          <Link href="/login" className="text-slate-900 hover:text-indigo-600">
            Login
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/signup"
            className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
          >
            Create Your Review Page
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Menu"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-100 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-600">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-1 hover:text-indigo-600"
              >
                {link.label}
              </a>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} className="py-1">
              Login
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-white"
            >
              Create Your Review Page
            </Link>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
