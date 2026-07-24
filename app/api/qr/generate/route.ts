import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";
import { generateShortCode } from "@/lib/generateShortCode";
import { subscriptionGuard } from "@/lib/guards/subscriptionGuard";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateQR } from "@/lib/qrGenerator";
import { generateQRSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/core/errors/handleApiError";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { logger } from "@/lib/logger";

function configureCloudinary() {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
        api_key: process.env.CLOUDINARY_API_KEY || "",
        api_secret: process.env.CLOUDINARY_API_SECRET || "",
    });
}

export async function POST(request: Request) {
    try {
        const { userId, workspaceId } = await resolveWorkspace();
        const session = await getServerSession(authOptions);

        await dbConnect();
        const body = await request.json();
        const {
            qrName,
            qrType,
            originalData,
            foregroundColor,
            backgroundColor,
            logoUrl,
            smartPageId,
        } = generateQRSchema.parse(body);

        if (smartPageId) {
            const { assertSmartPageInWorkspace } = await import(
                "@/modules/smartpage/service"
            );
            await assertSmartPageInWorkspace(smartPageId, workspaceId);
        }

        try {
            await subscriptionGuard(userId, workspaceId);
        } catch (e: unknown) {
            const isFreePlan = session?.user?.subscriptionPlan === "free";
            const message = e instanceof Error ? e.message : "QR limit reached";
            return NextResponse.json(
                {
                    success: false,
                    message,
                    upgradeRequired: isFreePlan,
                    currentPlan: session?.user?.subscriptionPlan || "free",
                },
                { status: 403 }
            );
        }

        const shortUrl = await generateShortCode();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const redirectUrl = `${baseUrl}/api/qr/redirect/${shortUrl}`;

        logger.info("QR generate started", { shortUrl, userId, workspaceId });

        const qrBuffer = await generateQR(redirectUrl, {
            foregroundColor: foregroundColor || "#000000",
            backgroundColor: backgroundColor || "#ffffff",
            logoUrl: logoUrl || undefined,
        });

        configureCloudinary();
        const uploadResponse = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "smart-qr",
                    public_id: `qr_${shortUrl}`,
                    resource_type: "image",
                    context: `userId=${userId}`,
                },
                (error, result) => {
                    if (error) reject(error);
                    else if (!result) reject(new Error("Empty Cloudinary response"));
                    else resolve(result as { secure_url: string });
                }
            );
            uploadStream.end(qrBuffer);
        });

        const newQRCode = await QRCode.create({
            userId: new mongoose.Types.ObjectId(userId),
            workspaceId: new mongoose.Types.ObjectId(workspaceId),
            smartPageId: smartPageId
                ? new mongoose.Types.ObjectId(smartPageId)
                : undefined,
            qrName,
            qrType,
            originalData,
            shortUrl,
            qrImageUrl: uploadResponse.secure_url,
            isDynamic: true,
            foregroundColor: foregroundColor || "#000000",
            backgroundColor: backgroundColor || "#ffffff",
            logoUrl: logoUrl || null,
        });

        return NextResponse.json({
            success: true,
            qrId: newQRCode._id,
            qrImageUrl: newQRCode.qrImageUrl,
            shortUrl: newQRCode.shortUrl,
        });
    } catch (error) {
        return handleApiError(error, "QR Generation Error");
    }
}
