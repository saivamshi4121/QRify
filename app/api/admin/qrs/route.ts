import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        await dbConnect();
        // Populate user details to know who owns the QR
        const qrs = await QRCode.find({})
            .populate("userId", "name email")
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: qrs });
    } catch (error) {
        return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
    }
}
