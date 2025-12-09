import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";
import ScanLog from "@/models/ScanLog";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await dbConnect();

        // Get all user's QR codes
        const qrCodes = await QRCode.find({ userId: session.user.id }).lean();

        // Get all scan logs for user's QR codes
        const qrCodeIds = qrCodes.map(qr => qr._id);
        const scanLogs = await ScanLog.find({ 
            qrCodeId: { $in: qrCodeIds } 
        }).lean();

        // Organize data
        const exportData = {
            user: {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                subscriptionPlan: session.user.subscriptionPlan,
                exportDate: new Date().toISOString(),
            },
            qrCodes: qrCodes.map(qr => ({
                id: qr._id,
                qrName: qr.qrName,
                qrType: qr.qrType,
                originalData: qr.originalData,
                shortUrl: qr.shortUrl,
                qrImageUrl: qr.qrImageUrl,
                isActive: qr.isActive,
                scanCount: qr.scanCount,
                createdAt: qr.createdAt,
                updatedAt: qr.updatedAt,
            })),
            analytics: scanLogs.map(log => ({
                qrCodeId: log.qrCodeId,
                ipAddress: log.ipAddress,
                deviceType: log.deviceType,
                os: log.os,
                browser: log.browser,
                country: log.country,
                city: log.city,
                scannedAt: log.scannedAt,
            })),
            summary: {
                totalQRCodes: qrCodes.length,
                totalScans: scanLogs.length,
                activeQRCodes: qrCodes.filter(qr => qr.isActive).length,
            },
        };

        return NextResponse.json({
            success: true,
            data: exportData,
        });

    } catch (error) {
        console.error("Export Data Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}




