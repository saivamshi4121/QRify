import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";
import ScanLog from "@/models/ScanLog";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ qrId: string }> | { qrId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Handle both Promise and direct params (Next.js 15+ compatibility)
        const resolvedParams = params instanceof Promise ? await params : params;
        const { qrId } = resolvedParams;

        await dbConnect();

        // STRICT OWNERSHIP CHECK - Only delete if user owns the QR
        const qr = await QRCode.findOne({
            _id: qrId,
            userId: session.user.id  // Critical: Only delete own QRs
        });

        if (!qr) {
            return NextResponse.json(
                { message: "QR Code not found or you are not authorized to delete it." },
                { status: 403 }
            );
        }

        // Delete associated scan logs first (optional, but good for data hygiene)
        try {
            await ScanLog.deleteMany({ qrId: qr._id });
        } catch (logError) {
            // Log but don't fail if scan log deletion fails
            console.warn("Failed to delete scan logs:", logError);
        }

        // Delete the QR Code
        await QRCode.findByIdAndDelete(qrId);

        return NextResponse.json({
            success: true,
            message: "QR Code deleted successfully"
        });

    } catch (error) {
        console.error("Delete QR Error:", error);
        return NextResponse.json(
            { success: false, message: String(error) },
            { status: 500 }
        );
    }
}



