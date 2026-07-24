import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";
import ScanLog from "@/models/ScanLog";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { ForbiddenError } from "@/core/errors/AppError";
import { logger } from "@/lib/logger";

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ qrId: string }> | { qrId: string } }
) {
    try {
        const { workspaceId } = await resolveWorkspace();

        const resolvedParams = params instanceof Promise ? await params : params;
        const { qrId } = resolvedParams;

        await dbConnect();

        const qr = await QRCode.findOne({
            _id: qrId,
            workspaceId,
        });

        if (!qr) {
            throw new ForbiddenError(
                "QR Code not found or you are not authorized to delete it."
            );
        }

        try {
            await ScanLog.deleteMany({ qrCodeId: qr._id });
        } catch (logError) {
            logger.warn("Failed to delete scan logs", {
                qrId: String(qr._id),
                error: String(logError),
            });
        }

        await QRCode.findByIdAndDelete(qrId);

        return NextResponse.json({
            success: true,
            message: "QR Code deleted successfully",
        });
    } catch (error) {
        return handleApiError(error, "Delete QR Error");
    }
}
