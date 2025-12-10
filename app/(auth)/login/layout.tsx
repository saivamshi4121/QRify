import { generateMetadata as genMeta } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = genMeta({
  title: "Login - QRify Account",
  description: "Sign in to your QRify account to access your QR codes, analytics, and management dashboard.",
  keywords: ["QRify login", "QR code account", "sign in"],
  url: "/login",
  type: "website",
  noindex: true,
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

