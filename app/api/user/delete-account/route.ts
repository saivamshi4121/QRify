import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/config/dbConnect";
import User from "@/models/User";
import QRCode from "@/models/QRCode";
import ScanLog from "@/models/ScanLog";
import Workspace from "@/models/Workspace";
import WorkspaceMember from "@/models/WorkspaceMember";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { handleApiError } from "@/core/errors/handleApiError";
import { UnauthorizedError } from "@/core/errors/AppError";

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        await dbConnect();
        const userId = session.user.id;

        const userQRCodes = await QRCode.find({ userId }).select("_id");
        const qrCodeIds = userQRCodes.map((qr) => qr._id);

        if (qrCodeIds.length > 0) {
            await ScanLog.deleteMany({ qrCodeId: { $in: qrCodeIds } });
        }

        await QRCode.deleteMany({ userId });

        // Remove memberships and workspaces owned by this user
        const ownedWorkspaces = await Workspace.find({ ownerId: userId }).select(
            "_id"
        );
        const ownedIds = ownedWorkspaces.map((w) => w._id);

        await WorkspaceMember.deleteMany({
            $or: [{ userId }, { workspaceId: { $in: ownedIds } }],
        });

        if (ownedIds.length > 0) {
            const SmartPage = (await import("@/models/SmartPage")).default;
            const Block = (await import("@/models/Block")).default;
            const pages = await SmartPage.find({
                workspaceId: { $in: ownedIds },
            }).select("_id");
            const pageIds = pages.map((p) => p._id);
            if (pageIds.length > 0) {
                await Block.deleteMany({ smartPageId: { $in: pageIds } });
            }
            const FeedbackResponse = (await import("@/models/FeedbackResponse"))
                .default;
            await FeedbackResponse.deleteMany({
                workspaceId: { $in: ownedIds },
            });
            await SmartPage.deleteMany({ workspaceId: { $in: ownedIds } });
        }

        await Workspace.deleteMany({ ownerId: userId });

        await User.findByIdAndDelete(userId);

        return NextResponse.json({
            success: true,
            message: "Account and all associated data deleted successfully",
        });
    } catch (error) {
        return handleApiError(error, "Delete Account Error");
    }
}
