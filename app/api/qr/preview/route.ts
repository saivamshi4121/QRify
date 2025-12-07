import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { generateShortCode } from "@/lib/generateShortCode";
import { generateQR } from "@/lib/qrGenerator";

// Lazy Cloudinary configuration to avoid build-time errors
function configureCloudinary() {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
        api_key: process.env.CLOUDINARY_API_KEY || "",
        api_secret: process.env.CLOUDINARY_API_SECRET || "",
    });
}

// Configure In-Memory Rate Limiting
const ipRateLimit = new Map<string, { count: number; lastReset: number }>();

export async function POST(request: Request) {
    try {
        // 1. Rate Limiting (Simple In-Memory for Dev)
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute
        const limit = 5; // 5 previews per minute per IP

        const record = ipRateLimit.get(ip) || { count: 0, lastReset: now };

        if (now - record.lastReset > windowMs) {
            record.count = 0;
            record.lastReset = now;
        }

        if (record.count >= limit) {
            return NextResponse.json(
                { success: false, message: "Rate limit exceeded. Try again later." },
                { status: 429 }
            );
        }

        record.count += 1;
        ipRateLimit.set(ip, record);
        // --- End Rate Limit ---

        const body = await request.json();
        const { originalData, foregroundColor, backgroundColor, logoUrl } = body;

        if (!originalData) {
            return NextResponse.json(
                { success: false, message: "Data is required" },
                { status: 400 }
            );
        }

        // 2. Generate Random Temp Code for Preview
        // This ensures density matches the final QR (which uses short URLs)
        const tempCode = await generateShortCode();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // NOTE: This URL will 404 if scanned because it's not saved to DB.
        // It is strictly for visual preview of what the dynamic QR will look like.
        const previewRedirectUrl = `${baseUrl}/api/qr/redirect/${tempCode}`;

        // 3. Generate QR with logo and colors (In-Memory)
        const qrBuffer = await generateQR(previewRedirectUrl, {
            foregroundColor: foregroundColor || "#000000",
            backgroundColor: backgroundColor || "#ffffff",
            logoUrl: logoUrl || null,
        });

        // 4. Upload to Cloudinary (Transient)
        configureCloudinary();
        const uploadResponse = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "smart-qr/previews",
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(qrBuffer);
        });

        // 5. Return URL
        return NextResponse.json({
            success: true,
            previewImageUrl: uploadResponse.secure_url,
        });

    } catch (error) {
        console.error("Preview Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
