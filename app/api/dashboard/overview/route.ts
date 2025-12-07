import { NextResponse, NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";
import ScanLog from "@/models/ScanLog";

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Use searchParams to get userId
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json(
                { success: false, message: "Valid User ID is required" },
                { status: 400 }
            );
        }

        // 1. Get QR Code Stats for User
        const qrStats = await QRCode.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalQRCodes: { $sum: 1 },
                    totalScans: { $sum: "$scanCount" },
                    activeQRCodes: {
                        $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
                    },
                    inactiveQRCodes: {
                        $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
                    },
                },
            },
        ]);

        // 2. Get Recent Scans for User's QRs
        // First find all QR IDs for this user
        const userQrs = await QRCode.find({ userId }).select("_id qrName").lean();
        const qrIds = userQrs.map(q => q._id);
        const qrMap = userQrs.reduce((acc: any, qr: any) => {
            acc[qr._id.toString()] = qr.qrName;
            return acc;
        }, {});

        const recentScansRaw = await ScanLog.find({ qrCodeId: { $in: qrIds } })
            .sort({ scannedAt: -1 })
            .limit(10)
            .lean();

        const recentScans = recentScansRaw.map(scan => ({
            qrCodeId: scan.qrCodeId,
            qrName: qrMap[scan.qrCodeId.toString()] || "Unknown QR",
            scannedAt: scan.scannedAt,
            country: scan.country,
            deviceType: scan.deviceType,
        }));

        const stats = qrStats[0] || {
            totalQRCodes: 0,
            totalScans: 0,
            activeQRCodes: 0,
            inactiveQRCodes: 0,
        };

        return NextResponse.json({
            success: true,
            data: {
                totalQRCodes: stats.totalQRCodes,
                totalScans: stats.totalScans,
                activeQRCodes: stats.activeQRCodes,
                inactiveQRCodes: stats.inactiveQRCodes,
                recentScans,
            },
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error", error: String(error) },
            { status: 500 }
        );
    }
}
