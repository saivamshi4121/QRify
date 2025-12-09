import Link from "next/link";
import {
  QrCode,
  BarChart3,
  Palette,
  ShieldCheck,
  Zap,
  Users,
  Check,
  ArrowRight,
  Menu,
} from "lucide-react";
import { generateMetadata as genMeta, generateStructuredData } from "@/lib/seo";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = genMeta({
  title: "QRify - Smart QR Code Generator SaaS",
  description: "Create, track, and manage dynamic QR codes with advanced analytics. Custom branding, real-time tracking, and bulk generation for businesses. Free plan available.",
  keywords: [
    "QR code generator",
    "dynamic QR codes",
    "QR code analytics",
    "custom QR codes",
    "QR code management",
    "business QR codes",
    "QR code tracking",
    "QR code SaaS",
    "India QR codes",
    "QR code API",
  ],
  url: "/",
  type: "website",
});

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <QrCode className="h-6 w-6" />
            <span>QRify</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <Link href="/dashboard" className="text-slate-900 hover:text-indigo-600">Login</Link>
          </div>
          <div className="flex items-center gap-3">
            {/* Create QR Code Button */}
            <Link href="/create">
              <button className="rounded-lg border border-indigo-600 px-4 py-2 text-indigo-600 hover:bg-indigo-50 font-medium transition">
                Create QR Code
              </button>
            </Link>

            {/* Get Started / Register Button */}
            <Link href="/signup">
              <button className="rounded-lg bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700 font-medium transition">
                Get Started
              </button>
            </Link>
          </div>
        </div>

      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-6">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Create, Track & Customize <br />
              <span className="text-indigo-600">Smart QR Codes</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0">
              Professional QR code management platform for businesses. Branded designs, real-time analytics, and dynamic editing without reprinting.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link href="/create">
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold shadow-lg shadow-indigo-200">
                  Create QR Code
                </button>
              </Link>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500 pt-4">
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> No credit card required</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> Free plan forever</div>
            </div>
          </div>

          {/* Hero Image / Mock Dashboard */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden p-2 backdrop-blur-xl">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 aspect-[4/3] flex flex-col gap-4">
                {/* Mock UI Header */}
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                  <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full max-w-[100px]"></div>
                </div>
                {/* Mock Chart Area */}
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-white rounded-lg shadow-sm border border-slate-100 p-4 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-indigo-50 to-transparent"></div>
                    <div className="flex items-end justify-between h-full gap-2 px-2 pb-2">
                      {[40, 65, 45, 90, 75, 55, 80].map((h, i) => (
                        <div key={i} style={{ height: `${h}%` }} className="w-full bg-indigo-500/80 rounded-t-sm"></div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-1 space-y-3">
                    <div className="h-full bg-white rounded-lg shadow-sm border border-slate-100 p-3 flex flex-col items-center justify-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">QR</div>
                      <div className="h-2 w-12 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating Badge */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl border border-slate-100 p-4 flex items-center gap-3 animate-bounce duration-[3000ms]">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">System Status</p>
                <p className="text-sm font-bold text-slate-800">99.9% Uptime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-10 border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100 last:divide-x-0">
            {[
              { label: "QRs Generated", value: "10,000+" },
              { label: "Businesses", value: "120+" },
              { label: "Scans Tracked", value: "1M+" },
              { label: "Uptime", value: "99.99%" },
            ].map((stat, i) => (
              <div key={i} className="px-4">
                <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
                <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="mx-auto max-w-7xl relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to grow</h2>
            <p className="text-lg text-slate-600">Powerful tools designed for marketing teams, event organizers, and businesses of all sizes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Dynamic QR Codes", desc: "Change destination URL instantly without reprinting your QR codes." },
              { icon: BarChart3, title: "Advanced Analytics", desc: "Track scans, location, device types, and time of day in real-time." },
              { icon: Palette, title: "Custom Branding", desc: "Add your logo, custom colors, and frames to match your brand identity." },
              { icon: ShieldCheck, title: "Secure Redirects", desc: "Enterprise-grade security ensuring safe scanning for your users." },
              { icon: Users, title: "Team Management", desc: "Invite team members and manage permsissions effortlessly." },
              { icon: QrCode, title: "Bulk Generation", desc: "Create thousands of unique QR codes via API or CSV upload." },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-6">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-400">Get up and running in less than 2 minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-700 -z-0"></div>

            {[
              { icon: QrCode, title: "1. Create QR", desc: "Enter your URL or content." },
              { icon: Palette, title: "2. Customize", desc: "Style it to match your brand." },
              { icon: BarChart3, title: "3. Track", desc: "Monitor performance live." },
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="h-24 w-24 bg-slate-800 rounded-full border-4 border-slate-900 flex items-center justify-center mb-6 shadow-xl">
                  <step.icon className="h-10 w-10 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-slate-400 max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 px-6 bg-indigo-50/50">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Perfect for every use case</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {["Marketing Campaigns", "Restaurant Menus", "Business Cards", "Event Tickets", "Real Estate", "Product Packaging", "Wi-Fi Access", "App Downloads"].map((useCase, i) => (
              <div key={i} className="bg-white rounded-xl p-6 text-center shadow-sm border border-indigo-100 font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-default">
                {useCase}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-600">Choose the plan that fits your needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold text-slate-900">Starter</h3>
              <div className="mt-4 mb-6"><span className="text-4xl font-bold text-slate-900">$0</span><span className="text-slate-500">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-600"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> 5 Dynamic QR Codes</li>
                <li className="flex items-center gap-3 text-slate-600"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> Basic Analytics</li>
                <li className="flex items-center gap-3 text-slate-600"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> Standard Support</li>
              </ul>
              <Link href="/dashboard" className="w-full py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold text-center hover:bg-slate-50">Start Free</Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-white rounded-2xl p-8 border-2 border-indigo-600 shadow-xl scale-105 relative flex flex-col z-10">
              <div className="absolute top-0 transform -translate-y-1/2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase">Popular</div>
              <h3 className="text-lg font-semibold text-slate-900">Pro</h3>
              <div className="mt-4 mb-6"><span className="text-4xl font-bold text-slate-900">$29</span><span className="text-slate-500">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-600"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> 50 Dynamic QR Codes</li>
                <li className="flex items-center gap-3 text-slate-600"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> Advanced Analytics</li>
                <li className="flex items-center gap-3 text-slate-600"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> Custom Logo & Colors</li>
                <li className="flex items-center gap-3 text-slate-600"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> Bulk Creation</li>
              </ul>
              <Link href="/dashboard" className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold text-center hover:bg-indigo-700 shadow-lg shadow-indigo-200">Get Started</Link>
            </div>

            {/* Business Tier */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold text-slate-900">Business</h3>
              <div className="mt-4 mb-6"><span className="text-4xl font-bold text-slate-900">$99</span><span className="text-slate-500">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-600"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> Unlimited QR Codes</li>
                <li className="flex items-center gap-3 text-slate-600"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> Team Collaboration</li>
                <li className="flex items-center gap-3 text-slate-600"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> API Access</li>
                <li className="flex items-center gap-3 text-slate-600"><Check className="h-5 w-5 text-indigo-600 shrink-0" /> Priority Support</li>
              </ul>
              <Link href="/dashboard" className="w-full py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold text-center hover:bg-slate-50">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-indigo-900 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 Mix-blend-overlay"></div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Start Creating Smart QR Codes Today</h2>
          <p className="text-indigo-100 text-lg">Join thousands of businesses optimizing their physical-to-digital touchpoints.</p>
          <Link href="/dashboard" className="inline-block bg-white text-indigo-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 hover:scale-105 transition-transform shadow-2xl">
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <QrCode className="h-6 w-6 text-indigo-600" />
            <span>QRify</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900">Terms of Service</a>
            <a href="#" className="hover:text-slate-900">Contact Support</a>
          </div>
          <div className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} QRify SaaS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
