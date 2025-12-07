import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        // Admin Lock
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        await dbConnect();

        // Delete QRs that are missing critical fields (Database Hygiene)
        const result = await QRCode.deleteMany({
            $or: [
                { shortUrl: { $exists: false } }, // Should accept null check
                { shortUrl: "" },
                { originalData: { $exists: false } }
            ]
        });

        return NextResponse.json({
            success: true,
            deletedCount: result.deletedCount,
            message: `Purged ${result.deletedCount} invalid QR codes.`
        });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
