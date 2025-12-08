import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/config/dbConnect";
import User from "@/models/User";
import QRCode from "@/models/QRCode";
import ScanLog from "@/models/ScanLog";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await dbConnect();
        const userId = session.user.id;

        // Get all user's QR codes
        const userQRCodes = await QRCode.find({ userId }).select("_id");
        const qrCodeIds = userQRCodes.map(qr => qr._id);

        // Delete all scan logs for user's QR codes
        if (qrCodeIds.length > 0) {
            await ScanLog.deleteMany({ qrCodeId: { $in: qrCodeIds } });
            console.log(`Deleted ${qrCodeIds.length} QR codes' scan logs for user ${userId}`);
        }

        // Delete all user's QR codes
        await QRCode.deleteMany({ userId });
        console.log(`Deleted all QR codes for user ${userId}`);

        // Delete user account
        await User.findByIdAndDelete(userId);
        console.log(`Deleted user account ${userId}`);

        return NextResponse.json({
            success: true,
            message: "Account and all associated data deleted successfully",
        });

    } catch (error) {
        console.error("Delete Account Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}



