import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const qrs = await QRCode.find({ userId: session.user.id }).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: qrs });
    } catch (error) {
        return NextResponse.json({ success: false, message: String(error) }, { status: 500 });
    }
}
