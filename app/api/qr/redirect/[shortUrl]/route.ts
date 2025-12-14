import { NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";
import ScanLog from "@/models/ScanLog";
import { getClientInfo } from "@/lib/clientInfo";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ shortUrl: string }> | { shortUrl: string } }
) {
    try {
        // STEP 1: Connect to MongoDB
        await dbConnect();

        // Handle both Promise and direct params (Next.js 15+ compatibility)
        const resolvedParams = params instanceof Promise ? await params : params;
        let { shortUrl } = resolvedParams;

        // Clean and validate shortUrl (remove any URL encoding, whitespace, etc.)
        if (shortUrl) {
            shortUrl = decodeURIComponent(shortUrl).trim();
        }

        // STEP 2: Prevent Preview QR from affecting scan counts
        // Preview QR codes should NOT increment scanCount
        if (shortUrl && shortUrl.startsWith("preview-")) {
            // Find preview QR for redirect only (no scan tracking)
            const previewQr = await QRCode.findOne({ shortUrl });
            if (previewQr && previewQr.isActive && previewQr.originalData) {
                let destination = previewQr.originalData;
                // Sanitize protocol for preview
                if (previewQr.qrType === "url" || !previewQr.qrType) {
                    if (!destination.match(/^https?:\/\//i) && !destination.startsWith("mailto:") && !destination.startsWith("tel:")) {
                        destination = `https://${destination}`;
                    }
                }
                return NextResponse.redirect(destination, { status: 302 });
            }
            return new NextResponse("Preview QR Code Not Found", { status: 404 });
        }

        // Debug: Log the shortUrl we're looking for
        console.log(`[QR Redirect] Looking for shortUrl: "${shortUrl}"`);

        // STEP 3: Fetch QR by shortUrl
        const qr = await QRCode.findOne({ shortUrl });

        // STEP 4: Validate QR exists
        if (!qr) {
            console.error(`[QR Redirect] QR not found for shortUrl: "${shortUrl}"`);
            return new NextResponse("QR Code Not Found", { status: 404 });
        }

        // Validate QR has required fields
        if (!qr.shortUrl || !qr.originalData || qr.originalData.trim() === "") {
            console.error(`[QR Redirect] Invalid legacy QR detected. QR ID: ${qr._id}, shortUrl: ${shortUrl}`);
            return NextResponse.json(
                { success: false, message: "Invalid legacy QR" },
                { status: 400 }
            );
        }

        // STEP 5: Validate QR isActive === true
        if (!qr.isActive) {
            return new NextResponse("This QR Code has been deactivated by the owner.", { status: 403 });
        }

        // Check Scan Limit (if set) - check BEFORE incrementing
        if (qr.scanLimit && qr.scanCount >= qr.scanLimit) {
            return new NextResponse("This QR Code has reached its scan limit.", { status: 403 });
        }

        // Check Expiry Date (if set)
        if (qr.expiryDate && new Date() > qr.expiryDate) {
            return new NextResponse("This QR Code has expired.", { status: 403 });
        }

        // STEP 6: Increment scanCount using ATOMIC update (BEFORE redirect)
        // This MUST happen synchronously before redirect to ensure count is accurate
        // Using atomic $inc operator prevents race conditions in serverless environments
        await QRCode.updateOne(
            { _id: qr._id },
            { $inc: { scanCount: 1 } }
        );

        // STEP 7: Log Analytics (NON-BLOCKING - fire and forget)
        // Analytics logging should NEVER block the redirect
        // Wrap in try/catch and fire-and-forget pattern
        (async () => {
            try {
                const headersList = headers();
                const clientInfo = getClientInfo(headersList);

                // Extract device type from device object
                const deviceType = clientInfo.device?.type || "unknown";
                
                // Create scan log entry (non-blocking)
                await ScanLog.create({
                    qrCodeId: qr._id,
                    ipAddress: clientInfo.ip || "Unknown",
                    userAgent: clientInfo.userAgent || "Unknown",
                    deviceType: deviceType,
                    os: clientInfo.device?.os || "Unknown",
                    browser: clientInfo.device?.browser || "Unknown",
                    country: clientInfo.geo?.country || "Unknown",
                    city: clientInfo.geo?.city || "Unknown",
                    scannedAt: new Date(),
                });
            } catch (logError) {
                // Analytics logging failure MUST NOT affect redirect
                console.error("Analytics Error (non-blocking):", logError);
            }
        })();

        // STEP 8: Perform HTTP 302 Redirect
        // Redirect happens AFTER scan count is incremented
        let destination = qr.originalData;

        // Debug logging
        console.log(`[QR Redirect] shortUrl: ${shortUrl}, originalData: ${destination}, qrType: ${qr.qrType}`);

        // Validate that originalData exists and is not empty
        if (!destination || destination.trim() === "") {
            console.error(`QR Code ${shortUrl} has empty originalData. QR Object:`, JSON.stringify(qr, null, 2));
            return new NextResponse("QR Code destination is not configured.", { status: 500 });
        }

        // Sanitize Protocol - handle different QR types
        if (qr.qrType === "email" && !destination.startsWith("mailto:")) {
            destination = `mailto:${destination}`;
        } else if (qr.qrType === "phone" && !destination.startsWith("tel:")) {
            destination = `tel:${destination}`;
        } else if (qr.qrType === "whatsapp" && !destination.startsWith("https://wa.me/") && !destination.startsWith("whatsapp://")) {
            // Format WhatsApp number (remove +, spaces, dashes)
            const cleanNumber = destination.replace(/[^\d]/g, "");
            destination = `https://wa.me/${cleanNumber}`;
        } else if (qr.qrType === "url" || !qr.qrType) {
            // For URL type or unknown type, ensure it has a protocol
            if (!destination.match(/^https?:\/\//i) && !destination.startsWith("mailto:") && !destination.startsWith("tel:")) {
                destination = `https://${destination}`;
            }
        }

        // Final validation - ensure destination is a valid URL
        try {
            new URL(destination);
        } catch (urlError) {
            console.error(`Invalid destination URL for QR ${shortUrl}: ${destination}`, urlError);
            return new NextResponse("Invalid destination URL configured for this QR Code.", { status: 500 });
        }

        console.log(`[QR Redirect] Redirecting to: ${destination}`);
        return NextResponse.redirect(destination, { status: 302 });

    } catch (error) {
        console.error("Redirect Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
