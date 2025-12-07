import { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";

// Lazy load geoip-lite to handle missing data files gracefully
let geoip: any = null;
let geoipAvailable = false;
let geoipInitialized = false;

// Initialize geoip-lite only when needed (lazy loading)
function initializeGeoip() {
    if (geoipInitialized) return;
    geoipInitialized = true;
    
    try {
        geoip = require("geoip-lite");
        // Test if geoip-lite is actually working (data files exist)
        try {
            geoip.lookup("8.8.8.8"); // Test lookup
            geoipAvailable = true;
        } catch (testError) {
            // Data files missing - disable geoip
            geoipAvailable = false;
            // Only log in development to avoid build warnings
            if (process.env.NODE_ENV === "development") {
                console.warn("geoip-lite data files not found, geo location features will be disabled");
            }
        }
    } catch (error) {
        // Module not available - disable geoip
        geoipAvailable = false;
        // Only log in development to avoid build warnings
        if (process.env.NODE_ENV === "development") {
            console.warn("geoip-lite not available, geo location features will be disabled:", error);
        }
    }
}

// Helper to get client info from headers
export function getClientInfo(headers: any) {
    const userAgent = headers.get("user-agent") || "";
    const ip = headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // Parse User Agent
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Parse Geo IP (Basic) - gracefully handle if geoip-lite is not available
    // NEVER crash the app if geoip fails
    let geo: any = null;
    try {
        // Initialize geoip only when needed (lazy loading)
        initializeGeoip();
        
        if (geoipAvailable && geoip) {
            geo = geoip.lookup(ip);
            // Validate geo result
            if (!geo || typeof geo !== "object") {
                geo = null;
            }
        }
    } catch (geoError: any) {
        // Silently fail - geo location is optional
        // Only log in development to avoid spam in production
        if (process.env.NODE_ENV === "development") {
            console.warn("GeoIP lookup failed (non-critical):", geoError?.message || "Unknown error");
        }
        geo = null;
    }

    return {
        ip,
        userAgent,
        device: {
            type: result.device.type || "desktop", // mobile, tablet, console, smarttv, wearable, embedded
            vendor: result.device.vendor || "Unknown",
            model: result.device.model || "Unknown",
            os: result.os.name || "Unknown",
            browser: result.browser.name || "Unknown",
        },
        geo: {
            country: geo?.country || "Unknown",
            city: geo?.city || "Unknown",
            region: geo?.region || "Unknown",
            lat: geo?.ll?.[0],
            lng: geo?.ll?.[1],
        },
    };
}
