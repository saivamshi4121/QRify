import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { generateMetadata as genMeta, generateStructuredData } from "@/lib/seo";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  ...genMeta({
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
  }),
  verification: {
    google: "U6pzhL-mhhEQJR3ch2urTIkwKufFDdXe5r9Sh99aKXk",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteSchema = generateStructuredData("Website");
  const organizationSchema = generateStructuredData("Organization");

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Structured Data */}
        <Script
          id="website-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />

        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SPYNB8PH4C"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SPYNB8PH4C', {
              page_path: window.location.pathname,
            });
          `}
        </Script>

        {/* Google Tag Manager */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <>
            <Script id="gtm" strategy="afterInteractive">
              {`
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
              `}
            </Script>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              />
            </noscript>
          </>
        )}

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
