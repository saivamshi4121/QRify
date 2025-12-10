import { Metadata } from "next";

type OpenGraphType = "website" | "article";

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  canonical?: string;
}

const defaultImage = "/og-image.png"; // You'll need to create this
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://qrify.app";
const siteName = "QRify - Smart QR Code Generator SaaS";

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image = defaultImage,
    url,
    type = "website",
    noindex = false,
    canonical,
  } = config;

  const fullTitle = `${title} | ${siteName}`;
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const imageUrl = image.startsWith("http") ? image : `${siteUrl}${image}`;
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : fullUrl;

  // Map "product" to "website" for OpenGraph (Next.js only supports "website" | "article")
  const openGraphType: OpenGraphType = type === "article" ? "article" : "website";

  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(", ") : undefined,
    authors: [{ name: "QRify" }],
    creator: "QRify",
    publisher: "QRify",
    robots: noindex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: openGraphType,
      url: fullUrl,
      title: fullTitle,
      description,
      siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: "@qrify", // Update with your Twitter handle
    },
    metadataBase: new URL(siteUrl),
    verification: {
      google: "U6pzhL-mhhEQJR3ch2urTIkwKufFDdXe5r9Sh99aKXk",
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
      yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
    },
  };
}

export function generateStructuredData(type: "Website" | "Organization" | "Product" | "FAQ", data?: any) {
  const baseSchema = {
    "@context": "https://schema.org",
    "@type": type,
  };

  switch (type) {
    case "Website":
      return {
        ...baseSchema,
        name: siteName,
        url: siteUrl,
        description: "Professional QR code generation and management platform",
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
        publisher: {
          "@type": "Organization",
          name: "QRify",
          url: siteUrl,
        },
      };

    case "Organization":
      return {
        ...baseSchema,
        name: "QRify",
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        sameAs: [
          // Add your social media links here
          // "https://twitter.com/qrify",
          // "https://linkedin.com/company/qrify",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "Customer Service",
          email: "support@qrify.app", // Update with your email
        },
      };

    case "Product":
      return {
        ...baseSchema,
        name: data?.name || "QR Code Generator",
        description: data?.description || "Create, track, and manage dynamic QR codes",
        brand: {
          "@type": "Brand",
          name: "QRify",
        },
        offers: {
          "@type": "Offer",
          price: data?.price || "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
      };

    case "FAQ":
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: data?.questions || [],
      };

    default:
      return baseSchema;
  }
}

export const defaultKeywords = [
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
];

