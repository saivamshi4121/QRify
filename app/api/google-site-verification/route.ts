import { NextResponse } from "next/server";

// This route handles Google Search Console verification via DNS
// Placeholder - replace with actual verification content from Google Search Console
export async function GET() {
  const verificationContent = process.env.GOOGLE_SITE_VERIFICATION_CONTENT || "google-site-verification-placeholder";

  return new NextResponse(verificationContent, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
