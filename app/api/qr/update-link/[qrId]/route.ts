import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";
import { updateLinkSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/core/errors/handleApiError";
import { ForbiddenError } from "@/core/errors/AppError";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { assertSmartPageInWorkspace } from "@/modules/smartpage/service";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ qrId: string }> | { qrId: string } }
) {
    try {
        const { workspaceId } = await resolveWorkspace();

        const resolvedParams = params instanceof Promise ? await params : params;
        const { qrId } = resolvedParams;

        const body = await request.json();
        const { newOriginalData, smartPageId } = updateLinkSchema.parse(body);

        await dbConnect();

        if (smartPageId) {
            await assertSmartPageInWorkspace(smartPageId, workspaceId);
        }

        const update: Record<string, unknown> = {};
        if (newOriginalData !== undefined) {
            update.originalData = newOriginalData;
        }
        if (smartPageId !== undefined) {
            update.smartPageId = smartPageId;
        }

        const updatedQR = await QRCode.findOneAndUpdate(
            {
                _id: qrId,
                workspaceId,
            },
            update,
            { new: true }
        );

        if (!updatedQR) {
            throw new ForbiddenError(
                "QR Code not found or you are not authorized to edit it."
            );
        }

        return NextResponse.json({
            success: true,
            message: "Link updated successfully",
            data: {
                originalData: updatedQR.originalData,
                smartPageId: updatedQR.smartPageId ?? null,
            },
        });
    } catch (error) {
        return handleApiError(error, "Update Link Error");
    }
}
