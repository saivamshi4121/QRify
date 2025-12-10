import { generateMetadata as genMeta } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = genMeta({
  title: "Pricing - QR Code Generator Plans",
  description: "Choose the perfect QR code plan for your business. Free plan available with 5 dynamic QR codes. Pro plans starting at $29/month with advanced analytics and custom branding.",
  keywords: [
    "QR code pricing",
    "QR code plans",
    "QR code subscription",
    "free QR codes",
    "QR code cost",
    "business QR codes pricing",
  ],
  url: "/pricing",
  type: "website",
});

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

