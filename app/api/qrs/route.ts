import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";

export async function GET() {
    try {
        const { workspaceId, userId } = await resolveWorkspace();
        await dbConnect();

        // Prefer workspace scope; include legacy orphans for this user (missing workspaceId)
        const qrs = await QRCode.find({
            $or: [
                { workspaceId },
                {
                    userId,
                    $or: [
                        { workspaceId: { $exists: false } },
                        { workspaceId: null },
                    ],
                },
            ],
        }).sort({ createdAt: -1 });

        // Opportunistic backfill so future workspace-only queries stay correct
        const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
        await mongoose.connection.collection("qrcodes").updateMany(
            {
                userId: new mongoose.Types.ObjectId(userId),
                $or: [
                    { workspaceId: { $exists: false } },
                    { workspaceId: null },
                ],
            },
            { $set: { workspaceId: workspaceObjectId } }
        );

        return NextResponse.json({ success: true, data: qrs });
    } catch (error) {
        return handleApiError(error, "List QRs Error");
    }
}
