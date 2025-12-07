export const PRICING_PLANS = {
    free: {
        name: "Free",
        price: 0,
        currency: "INR",
        maxQRCodes: 3,
        analytics: "basic",
        description: "For individuals exploring QR codes.",
        features: [
            "3 Dynamic QR Codes",
            "Basic Scan Analytics",
            "Standard Support",
            "Static QR Codes",
        ]
    },
    pro: {
        name: "Pro",
        price: 499,
        currency: "INR",
        maxQRCodes: 5,
        analytics: "full",
        description: "For professionals and creators.",
        features: [
            "5 Dynamic QR Codes",
            "Advanced Analytics (Geo, Device)",
            "Custom Logo & Colors",
            "Remove Watermark",
            "Priority Support",
        ]
    },
    business: {
        name: "Business",
        price: 1499,
        currency: "INR",
        maxQRCodes: 1000000, // Effectively unlimited
        analytics: "advanced",
        teamAccess: true,
        description: "For agencies and teams.",
        features: [
            "Unlimited QR Codes",
            "Team Management",
            "API Access",
            "White Labeling",
            "Dedicated Account Manager",
        ]
    },
};

export type PlanType = keyof typeof PRICING_PLANS;
