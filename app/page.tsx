import Script from "next/script";
import type { Metadata } from "next";
import { generateMetadata as genMeta, generateStructuredData } from "@/lib/seo";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { EcosystemSection } from "@/components/landing/EcosystemSection";
import { InteractiveShowcase } from "@/components/landing/InteractiveShowcase";
import { FeatureStoriesSection } from "@/components/landing/FeatureStoriesSection";
import { IndustrySolutionsSection } from "@/components/landing/IndustrySolutionsSection";
import { DeveloperPlatformSection } from "@/components/landing/DeveloperPlatformSection";
import { EnterpriseTrustSection } from "@/components/landing/EnterpriseTrustSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = genMeta({
  title: "Qrezo — Enterprise Programmable Smart QR & Event Scanner Platform",
  description:
    "Generate dynamic QR codes, automate Google review routing, manage high-concurrency event check-ins, and orchestrate customer touchpoints in one unified platform.",
  keywords: [
    "Google reviews for restaurants",
    "Smart QR code platform",
    "private customer feedback",
    "event scanner app PWA",
    "collect Google reviews",
    "programmable QR API",
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

  return (
    <div className="min-h-screen bg-[#030712] font-sans text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Global Enterprise Header */}
      <LandingHeader />

      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Enterprise Customer Logos & Live Metrics */}
      <TrustSection />

      {/* 3. Product Ecosystem Suite */}
      <EcosystemSection />

      {/* 4. Interactive Live Tour (Browser Studio, Mobile Scanner PWA, Review Page, Digital Pass) */}
      <InteractiveShowcase />

      {/* 5. Deep-Dive Feature Presentation Stories */}
      <FeatureStoriesSection />

      {/* 6. Tailored Industry Solutions */}
      <IndustrySolutionsSection />

      {/* 7. Developer Platform, REST APIs & SDKs */}
      <DeveloperPlatformSection />

      {/* 8. Enterprise Trust, Security & Compliance */}
      <EnterpriseTrustSection />

      {/* 9. Transparent SaaS Pricing & Annual Toggle */}
      <PricingSection />

      {/* 10. FAQ Accordion */}
      <FaqSection />

      {/* 11. Final High-Converting Call to Action */}
      <FinalCtaSection />

      {/* 12. Enterprise Footer */}
      <LandingFooter />
    </div>
  );
}
