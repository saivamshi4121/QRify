import { generateMetadata as genMeta } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = genMeta({
  title: "Sign Up - Create Qrezo Account",
  description: "Create your free Qrezo account and start generating dynamic QR codes with advanced analytics. No credit card required.",
  keywords: ["Qrezo signup", "create QR code account", "free QR codes"],
  url: "/signup",
  type: "website",
});

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}



