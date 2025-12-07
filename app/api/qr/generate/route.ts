import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";
import { generateShortCode } from "@/lib/generateShortCode";
import { subscriptionGuard } from "@/lib/guards/subscriptionGuard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateQR } from "@/lib/qrGenerator";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    try {
        // 1. Auth Check - Strict
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, message: "Login required to download QR" },
                { status: 401 }
            );
        }

        await dbConnect();
        const body = await request.json();
        const { qrName, qrType, originalData, foregroundColor, backgroundColor, logoUrl } = body;
        const userId = session.user.id;

        // Validation
        if (!qrName || !qrType || !originalData) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Guard: Check Subscription Limits
        try {
            await subscriptionGuard(userId);
        } catch (e: any) {
            // Return upgrade message for free plan users
            const isFreePlan = session.user.subscriptionPlan === "free";
            return NextResponse.json(
                { 
                    success: false, 
                    message: e.message || "QR limit reached",
                    upgradeRequired: isFreePlan,
                    currentPlan: session.user.subscriptionPlan || "free",
                },
                { status: 403 }
            );
        }

        // 2. Generate Guaranteed Unique Short URL
        // The updated lib function handles the loop/db check internally
        const shortUrl = await generateShortCode();

        // 3. Construct the Internal Redirect URL
        // This effectively "locks" the QR to this shortUrl forever
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const redirectUrl = `${baseUrl}/api/qr/redirect/${shortUrl}`;
        
        console.log(`[QR Generate] Generated shortUrl: "${shortUrl}"`);
        console.log(`[QR Generate] Redirect URL for QR: "${redirectUrl}"`);

        // 4. Generate QR Code with logo and colors
        const qrBuffer = await generateQR(redirectUrl, {
            foregroundColor: foregroundColor || "#000000",
            backgroundColor: backgroundColor || "#ffffff",
            logoUrl: logoUrl || null,
        });

        // 5. Upload to Cloudinary
        const uploadResponse = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "smart-qr",
                    public_id: `qr_${shortUrl}`,
                    resource_type: "image",
                    context: `userId=${userId}`,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(qrBuffer);
        });

        // 6. Save to Database - Enforcing Ownership
        console.log(`[QR Generate] Saving QR with shortUrl: "${shortUrl}", originalData: "${originalData}"`);
        
        const newQRCode = await QRCode.create({
            userId,           // <-- Belongs to THIS user
            qrName,
            qrType,
            originalData,     // <-- The real destination
            shortUrl,         // <-- The unique lookup key
            qrImageUrl: uploadResponse.secure_url,
            isDynamic: true,
            foregroundColor: foregroundColor || "#000000",
            backgroundColor: backgroundColor || "#ffffff",
            logoUrl: logoUrl || null,
        });

        console.log(`[QR Generate] QR saved successfully! ID: ${newQRCode._id}, shortUrl: ${newQRCode.shortUrl}`);

        // Verify it was saved by querying it back
        const verifyQR = await QRCode.findOne({ shortUrl });
        if (!verifyQR) {
            console.error(`[QR Generate] ERROR: QR was not found after saving! shortUrl: "${shortUrl}"`);
        } else {
            console.log(`[QR Generate] Verification: QR found in DB with shortUrl: "${verifyQR.shortUrl}"`);
        }

        return NextResponse.json({
            success: true,
            qrId: newQRCode._id,
            qrImageUrl: newQRCode.qrImageUrl,
            shortUrl: newQRCode.shortUrl,
        });

    } catch (error) {
        console.error("QR Generation Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error", error: String(error) },
            { status: 500 }
        );
    }
}
