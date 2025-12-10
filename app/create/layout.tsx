import { generateMetadata as genMeta } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = genMeta({
  title: "Create QR Code - Free QR Generator",
  description: "Create custom QR codes instantly. Add logos, customize colors, and generate dynamic QR codes that can be updated without reprinting.",
  keywords: [
    "create QR code",
    "QR code generator free",
    "custom QR code",
    "QR code maker",
    "generate QR code",
  ],
  url: "/create",
  type: "website",
});

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

