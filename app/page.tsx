import Link from "next/link";
import Script from "next/script";
import type { Metadata } from "next";
import { generateMetadata as genMeta, generateStructuredData } from "@/lib/seo";
import { PRICING_PLANS } from "@/lib/pricing";
import { LandingHeader } from "@/components/landing/LandingHeader";

export const metadata: Metadata = genMeta({
  title: "Collect more Google Reviews with QR Review Pages",
  description:
    "Create a Review Page in minutes. Happy guests go to Google. Unhappy ones tell you privately. Built for restaurants, cafés, hotels, and local businesses.",
  keywords: [
    "Google reviews for restaurants",
    "QR code review page",
    "private customer feedback",
    "restaurant review QR",
    "collect Google reviews",
    "QR powered customer experience",
    "café Google reviews",
    "hotel guest feedback",
  ],
  url: "/",
  type: "website",
});

const FAQ_ITEMS = [
  {
    q: "How does Google Review routing work?",
    a: "Guests rate their visit. High scores get a clear path to leave a Google review. Lower scores stay with you as private feedback.",
  },
  {
    q: "Can I collect private feedback?",
    a: "Yes. Guests below your rating threshold can share comments only you see—so you can fix issues before they become public reviews.",
  },
  {
    q: "Can I use my existing QR codes?",
    a: "Dynamic Qrezo QR codes can point at your Review Page anytime. Static printed codes need a Qrezo QR (or a reprint) for editable destinations.",
  },
  {
    q: "Do customers need an app?",
    a: "No. They scan and open a mobile page in their browser—nothing to install.",
  },
  {
    q: "Can I manage multiple locations?",
    a: "Yes. Create a Review Page and QR for each location and track them separately.",
  },
];

function ReviewPhonePreview() {
  return (
    <div
      id="demo"
      className="mx-auto w-full max-w-[280px] scroll-mt-28 sm:max-w-[300px]"
    >
      <div
        className="overflow-hidden rounded-[1.75rem] border-[8px] border-slate-800 bg-white shadow-2xl"
        style={{ minHeight: 520 }}
      >
        <div className="flex h-6 items-center justify-center bg-slate-800">
          <div className="h-1.5 w-16 rounded-full bg-slate-600" />
        </div>
        <div className="space-y-6 px-5 py-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
            BT
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">Bella Trattoria</p>
            <p className="mt-1 text-sm text-slate-500">
              Thanks for dining with us!
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              How was your experience today?
            </p>
            <div className="mt-3 flex justify-center gap-1.5 text-2xl text-amber-400">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span className="text-slate-200">★</span>
            </div>
          </div>
          <div className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">
            Leave a Google Review
          </div>
          <p className="text-xs text-slate-400">
            Lower ratings stay private with the restaurant
          </p>
        </div>
      </div>
    </div>
  );
}

function AnalyticsMock() {
  const metrics = [
    { label: "QR Scans", value: "1,284" },
    { label: "Average Rating", value: "4.6" },
    { label: "Google Review Clicks", value: "312" },
    { label: "Private Feedback", value: "47" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-100 px-5 py-3">
        <p className="text-sm font-semibold text-slate-900">Analytics</p>
        <p className="text-xs text-slate-400">Last 30 days</p>
      </div>
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4"
          >
            <p className="text-xs font-medium text-slate-500">{m.label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
              {m.value}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 px-5 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Top performing review pages
        </p>
        <ul className="space-y-2 text-sm">
          {[
            { name: "Downtown · Table cards", rate: "38% response" },
            { name: "Airport café", rate: "31% response" },
            { name: "Hotel lobby", rate: "27% response" },
          ].map((row) => (
            <li
              key={row.name}
              className="flex items-center justify-between gap-3 text-slate-700"
            >
              <span className="truncate">{row.name}</span>
              <span className="shrink-0 tabular-nums text-slate-500">
                {row.rate}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const faqSchema = generateStructuredData("FAQ", {
    questions: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  });

  const free = PRICING_PLANS.free;
  const pro = PRICING_PLANS.pro;
  const business = PRICING_PLANS.business;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <LandingHeader />

      {/* 1–2: Problem → Outcome */}
      <section className="px-6 pb-16 pt-28 md:pb-24 md:pt-36">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-6 text-center lg:text-left">
            <p className="text-sm font-medium text-slate-500">
              Most guests never leave a review—and the unhappy ones often post
              publicly first.
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-[3.25rem]">
              Collect more Google Reviews.{" "}
              <span className="text-indigo-600">
                Hear from unhappy guests first.
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-slate-600 lg:mx-0">
              Qrezo gives restaurants and local businesses a Review Page behind
              a QR code. Happy guests go to Google. Unhappy ones tell you
              privately—before they post online.
            </p>
            <ul className="mx-auto max-w-xl space-y-2 text-left text-sm text-slate-600 lg:mx-0">
              <li>More 5-star Google reviews from happy customers</li>
              <li>Private feedback when something goes wrong</li>
              <li>A guest-ready page live in minutes</li>
            </ul>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/signup"
                className="inline-flex rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              >
                Create Your Review Page
              </Link>
              <a
                href="#demo"
                className="inline-flex rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                See Live Demo
              </a>
            </div>
            <p className="text-sm text-slate-500">
              No credit card · Free to start · Live in minutes
            </p>
          </div>
          <ReviewPhonePreview />
        </div>
      </section>

      {/* Audience */}
      <section className="border-y border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm font-medium text-slate-500">
            Built for businesses that meet customers face-to-face
          </p>
          <p className="mt-4 text-sm font-semibold tracking-wide text-slate-800 sm:text-base">
            Restaurants · Cafés · Bakeries · Hotels · Salons · Clinics
          </p>
        </div>
      </section>

      {/* 3: How Qrezo solves it */}
      <section id="how-it-works" className="scroll-mt-24 bg-slate-900 px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Here&apos;s how it works
            </h2>
            <p className="mt-4 text-slate-400">
              One Review Page. One QR. Guests scan and rate—no app required.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {[
              {
                n: "1",
                title: "Create your Review Page",
                body: "Add your name, welcome message, Google review link, and when to ask for private feedback.",
              },
              {
                n: "2",
                title: "Print your QR Code",
                body: "Place it on tables, receipts, or the counter. Change the destination anytime without reprinting.",
              },
              {
                n: "3",
                title: "Customers scan, rate & review",
                body: "High ratings go to Google. Lower ratings stay private with you.",
              },
            ].map((step) => (
              <div key={step.n} className="text-center md:text-left">
                <p className="text-4xl font-extrabold text-indigo-400">
                  {step.n}
                </p>
                <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-14 max-w-2xl text-center text-sm text-slate-400">
            Every scan becomes a chance to grow your reputation—or fix a problem
            quietly.
          </p>
        </div>
      </section>

      {/* 4: Features */}
      <section id="features" className="scroll-mt-24 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              What&apos;s included
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              The tools behind better reviews—explained in plain language.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Review Pages",
                desc: "Branded mobile pages guests open after a scan.",
              },
              {
                title: "Smart QR Codes",
                desc: "Update where the QR goes anytime—no reprinting.",
              },
              {
                title: "Google Review Routing",
                desc: "Send happy guests straight to your Google listing.",
              },
              {
                title: "Private Feedback Collection",
                desc: "Hear from unhappy guests first, privately.",
              },
              {
                title: "Analytics Dashboard",
                desc: "Scans, ratings, and Google clicks in one place.",
              },
              {
                title: "Multi-location Ready",
                desc: "A page and QR per location as you grow.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
              >
                <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="scroll-mt-24 bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              More than QR Codes.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Qrezo is expanding into QR-powered business experiences.
              Restaurant Reviews are available today; more templates are coming.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { name: "Restaurant Reviews", status: "Available", live: true },
              { name: "Business Profile", status: "Coming Soon", live: false },
              { name: "Portfolio", status: "Coming Soon", live: false },
              { name: "Event Page", status: "Coming Soon", live: false },
              { name: "Wedding Page", status: "Coming Soon", live: false },
            ].map((t) => (
              <div
                key={t.name}
                className={`rounded-2xl border p-6 ${
                  t.live
                    ? "border-indigo-200 bg-indigo-50/50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="font-semibold text-slate-900">{t.name}</p>
                <p
                  className={`mt-2 text-xs font-semibold uppercase tracking-wide ${
                    t.live ? "text-indigo-600" : "text-slate-400"
                  }`}
                >
                  {t.status}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/signup"
              className="inline-flex rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Start with Restaurant Reviews
            </Link>
          </div>
        </div>
      </section>

      {/* Analytics proof */}
      <section id="analytics" className="scroll-mt-24 px-6 py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              See what&apos;s working
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Track the numbers that matter to your business—scans, ratings, and
              how many guests clicked through to Google.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-600">
              <li>QR Scans</li>
              <li>Average Rating</li>
              <li>Google Review Clicks</li>
              <li>Private Feedback</li>
              <li>Top Performing Review Pages</li>
            </ul>
          </div>
          <AnalyticsMock />
        </div>
      </section>

      {/* 5a: Pricing */}
      <section id="pricing" className="scroll-mt-24 bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Simple pricing that grows with you
            </h2>
            <p className="mt-4 text-slate-600">
              Start free. Upgrade when you need more QR codes and review pages.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                {free.name}
              </h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-slate-900">
                  ₹{free.price}
                </span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="mb-8 flex-1 space-y-3 text-sm text-slate-600">
                <li>Review Pages to get started</li>
                <li>{free.features[0]}</li>
                <li>Basic analytics</li>
                <li>Standard support</li>
              </ul>
              <Link
                href="/signup"
                className="rounded-lg border border-slate-300 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Start Free
              </Link>
            </div>

            <div className="relative z-10 flex scale-[1.02] flex-col rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-xl">
              <p className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Popular
              </p>
              <h3 className="text-lg font-semibold text-slate-900">
                {pro.name}
              </h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-slate-900">
                  ₹{pro.price}
                </span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="mb-8 flex-1 space-y-3 text-sm text-slate-600">
                <li>Review Pages + Google routing</li>
                <li>{pro.features[0]}</li>
                <li>Full analytics</li>
                <li>Custom logo &amp; colors</li>
              </ul>
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
              >
                Get Started
              </Link>
            </div>

            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                {business.name}
              </h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-slate-900">
                  ₹{business.price}
                </span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="mb-8 flex-1 space-y-3 text-sm text-slate-600">
                <li>Multi-location review pages</li>
                <li>Unlimited QR codes</li>
                <li>Team management</li>
                <li>Priority support</li>
              </ul>
              <Link
                href="/pricing"
                className="rounded-lg border border-slate-300 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                See full pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5b: FAQ */}
      <section id="faq" className="scroll-mt-24 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900 md:text-4xl">
            Questions, answered
          </h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-slate-200 bg-white px-5 py-4"
              >
                <summary className="cursor-pointer list-none text-left text-base font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-indigo-900 px-6 py-24 text-center">
        <div className="relative z-10 mx-auto max-w-3xl space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Ready for more reviews—and fewer surprises?
          </h2>
          <p className="text-lg text-indigo-100">
            Create your Review Page, print one QR, and start listening to every
            guest.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-block rounded-xl bg-white px-8 py-4 text-lg font-bold text-indigo-900 shadow-2xl transition hover:bg-indigo-50"
            >
              Create Your Review Page
            </Link>
            <a
              href="#pricing"
              className="text-sm font-medium text-indigo-200 underline-offset-4 hover:text-white hover:underline"
            >
              See pricing
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <p className="text-xl font-bold text-slate-900">Qrezo</p>
            <p className="mt-1 text-sm text-slate-500">
              QR-powered customer experiences for local businesses.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-900">
              Terms of Service
            </a>
            <a href="#" className="hover:text-slate-900">
              Contact Support
            </a>
          </div>
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Qrezo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
