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
        await dbConnect();

        // Handle both Promise and direct params (Next.js 15+ compatibility)
        const resolvedParams = params instanceof Promise ? await params : params;
        let { shortUrl } = resolvedParams;

        // Clean and validate shortUrl (remove any URL encoding, whitespace, etc.)
        if (shortUrl) {
            shortUrl = decodeURIComponent(shortUrl).trim();
        }

        // Debug: Log the shortUrl we're looking for
        console.log(`[QR Redirect] Looking for shortUrl: "${shortUrl}"`);
        console.log(`[QR Redirect] Request URL: ${request.url}`);

        // 1. Find the QR Code STRICTLY by shortUrl
        // This is the only "Public Key" needed. We do not check userId here because
        // scanning is a public action.
        const qr = await QRCode.findOne({ shortUrl });

        // Debug: Log if QR was found
        if (!qr) {
            console.error(`[QR Redirect] QR not found for shortUrl: "${shortUrl}"`);
            // Also check if there are any QRs in the database
            const totalQRs = await QRCode.countDocuments();
            console.log(`[QR Redirect] Total QRs in database: ${totalQRs}`);
            // List a few shortUrls for debugging
            const sampleQRs = await QRCode.find().select("shortUrl").limit(5).lean();
            console.log(`[QR Redirect] Sample shortUrls in DB:`, sampleQRs.map(q => q.shortUrl));
        } else {
            console.log(`[QR Redirect] QR found! ID: ${qr._id}, originalData: ${qr.originalData}`);
        }

        if (!qr) {
            // Using a simple 404 text response. In production, could be a branded 404 page.
            return new NextResponse("QR Code Not Found", { status: 404 });
        }

        // 2. Handle Legacy QR Codes (old QRs without shortUrl or originalData)
        if (!qr.shortUrl || !qr.originalData || qr.originalData.trim() === "") {
            console.error(`[QR Redirect] Invalid legacy QR detected. QR ID: ${qr._id}, shortUrl: ${shortUrl}`);
            return NextResponse.json(
                { success: false, message: "Invalid legacy QR" },
                { status: 400 }
            );
        }

        // 3. Check Valid/Active Status
        if (!qr.isActive) {
            return new NextResponse("This QR Code has been deactivated by the owner.", { status: 403 });
        }

        // 4. Check Scan Limit (if set)
        if (qr.scanLimit && qr.scanCount >= qr.scanLimit) {
            return new NextResponse("This QR Code has reached its scan limit.", { status: 403 });
        }

        // 5. Check Expiry Date (if set)
        if (qr.expiryDate && new Date() > qr.expiryDate) {
            return new NextResponse("This QR Code has expired.", { status: 403 });
        }

        // 6. Log the Scan (Analytics) - This should NEVER block the redirect
        // We do this in a fire-and-forget way to ensure redirect always works
        (async () => {
            try {
                const headersList = headers();
                const clientInfo = getClientInfo(headersList);

                // Extract device type from device object
                const deviceType = clientInfo.device?.type || "unknown";
                
                // Fire and forget logging logic - Match ScanLog model schema exactly
                await ScanLog.create({
                    qrCodeId: qr._id,  // Must match model field name
                    ipAddress: clientInfo.ip || "Unknown",
                    userAgent: clientInfo.userAgent || "Unknown",
                    deviceType: deviceType,  // mobile, tablet, desktop, etc.
                    os: clientInfo.device?.os || "Unknown",
                    browser: clientInfo.device?.browser || "Unknown",
                    country: clientInfo.geo?.country || "Unknown",
                    city: clientInfo.geo?.city || "Unknown",
                    scannedAt: new Date(),
                });

                // Increment atomic counter
                await QRCode.findByIdAndUpdate(qr._id, { $inc: { scanCount: 1 } });
            } catch (logError) {
                // Logging failure should NEVER stop the redirect
                console.error("Analytics Error (non-blocking):", logError);
            }
        })();

        // 7. Perform the Real Redirect to ORIGINAL DATA
        // We TRUST originalData because it can only be set/updated by the owner via Authorized API.
        // originalData is the user's chosen destination - this is what they want to redirect to
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
