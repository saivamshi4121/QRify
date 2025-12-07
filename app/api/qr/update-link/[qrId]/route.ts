import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(
    request: Request,
    { params }: { params: { qrId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { newOriginalData } = await request.json();
        if (!newOriginalData) {
            return NextResponse.json({ message: "New data is required" }, { status: 400 });
        }

        await dbConnect();

        // STRICT OWNERSHIP CHECK
        // Only update if _id matches AND userId matches session
        const updatedQR = await QRCode.findOneAndUpdate(
            {
                _id: params.qrId,
                userId: session.user.id  // <--- The Critical Lock
            },
            { originalData: newOriginalData },
            { new: true }
        );

        if (!updatedQR) {
            // If not found, it means either:
            // 1. QR doesn't exist
            // 2. User is trying to hack someone else's QR
            return NextResponse.json(
                { message: "QR Code not found or you are not authorized to edit it." },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Link updated successfully",
            data: {
                originalData: updatedQR.originalData
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
    }
}
