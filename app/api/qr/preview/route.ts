import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { generateTempShortCode } from "@/lib/generateShortCode";
import { generateQR } from "@/lib/qrGenerator";
import { previewQRSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/core/errors/handleApiError";

function configureCloudinary() {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
        api_key: process.env.CLOUDINARY_API_KEY || "",
        api_secret: process.env.CLOUDINARY_API_SECRET || "",
    });
}

const ipRateLimit = new Map<string, { count: number; lastReset: number }>();

export async function POST(request: Request) {
    try {
        const ip = request.headers.get("x-forwarded-for") || "unknown";
        const now = Date.now();
        const windowMs = 60 * 1000;
        const limit = 5;

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

        const body = await request.json();
        const { originalData, foregroundColor, backgroundColor, logoUrl } =
            previewQRSchema.parse(body);

        // Ephemeral preview URL — no DB uniqueness check required
        const tempCode = generateTempShortCode();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const previewRedirectUrl = `${baseUrl}/api/qr/redirect/${tempCode}`;

        const qrBuffer = await generateQR(previewRedirectUrl, {
            foregroundColor: foregroundColor || "#000000",
            backgroundColor: backgroundColor || "#ffffff",
            logoUrl: logoUrl || undefined,
        });

        configureCloudinary();
        const uploadResponse = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "smart-qr/previews",
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) reject(error);
                    else if (!result) reject(new Error("Empty Cloudinary response"));
                    else resolve(result as { secure_url: string });
                }
            );
            uploadStream.end(qrBuffer);
        });

        return NextResponse.json({
            success: true,
            previewImageUrl: uploadResponse.secure_url,
        });

    } catch (error) {
        return handleApiError(error, "Preview Error");
    }
}
