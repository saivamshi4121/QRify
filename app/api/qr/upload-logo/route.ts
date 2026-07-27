import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v2 as cloudinary } from "cloudinary";
import { authOptions } from "@/lib/auth";
import { handleApiError } from "@/core/errors/handleApiError";
import { BadRequestError } from "@/core/errors/AppError";

const ALLOWED_MIME_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

// Guest create-flow still needs uploads; rate-limit by IP when unauthenticated.
const ipRateLimit = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10;

function configureCloudinary() {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
        api_key: process.env.CLOUDINARY_API_KEY || "",
        api_secret: process.env.CLOUDINARY_API_SECRET || "",
    });
}

function checkGuestRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = ipRateLimit.get(ip) || { count: 0, lastReset: now };

    if (now - record.lastReset > RATE_LIMIT_WINDOW_MS) {
        record.count = 0;
        record.lastReset = now;
    }

    if (record.count >= RATE_LIMIT_MAX) {
        return false;
    }

    record.count += 1;
    ipRateLimit.set(ip, record);
    return true;
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const isAuthenticated = Boolean(session?.user?.id);

        // Guests may upload (create page is public); throttle unauthenticated abuse.
        if (!isAuthenticated) {
            const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
            if (!checkGuestRateLimit(ip)) {
                return NextResponse.json(
                    { success: false, message: "Rate limit exceeded. Try again later." },
                    { status: 429 }
                );
            }
        }

        const formData = await request.formData();
        const file = formData.get("logo");

        if (!(file instanceof File)) {
            throw new BadRequestError("No file provided");
        }

        if (!ALLOWED_MIME_TYPES.has(file.type)) {
            throw new BadRequestError("File must be a PNG, JPEG, or WebP image");
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestError("File must be less than 2MB");
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        configureCloudinary();
        const uploadResponse = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "smart-qr/logos",
                    resource_type: "image",
                    allowed_formats: ["png", "jpg", "jpeg", "webp"],
                    transformation: [
                        { width: 500, height: 500, crop: "limit" },
                        { quality: "auto" },
                    ],
                },
                (error, result) => {
                    if (error) reject(error);
                    else if (!result) reject(new Error("Empty Cloudinary response"));
                    else resolve(result as { secure_url: string });
                }
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json({
            success: true,
            logoUrl: uploadResponse.secure_url,
        });

    } catch (error) {
        return handleApiError(error, "Logo Upload Error");
    }
}
