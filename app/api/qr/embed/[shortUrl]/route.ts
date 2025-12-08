import { NextResponse } from "next/server";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ shortUrl: string }> | { shortUrl: string } }
) {
    try {
        await dbConnect();

        const resolvedParams = params instanceof Promise ? await params : params;
        let { shortUrl } = resolvedParams;

        if (shortUrl) {
            shortUrl = decodeURIComponent(shortUrl).trim();
        }

        const qr = await QRCode.findOne({ shortUrl }).select("qrImageUrl qrName shortUrl isActive");

        if (!qr || !qr.isActive) {
            return NextResponse.json(
                { success: false, message: "QR code not found or inactive" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                qrImageUrl: qr.qrImageUrl,
                qrName: qr.qrName,
                shortUrl: qr.shortUrl,
            },
        });
    } catch (error) {
        console.error("Embed QR Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}



