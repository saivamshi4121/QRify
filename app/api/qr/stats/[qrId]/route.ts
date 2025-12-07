import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import ScanLog from "@/models/ScanLog";
import QRCode from "@/models/QRCode";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ qrId: string }> }
) {
    try {
        await dbConnect();
        const { qrId } = await params;

        if (!mongoose.Types.ObjectId.isValid(qrId)) {
            return NextResponse.json(
                { success: false, message: "Invalid QR ID" },
                { status: 400 }
            );
        }

        // Ensure QR Exists
        const qrExists = await QRCode.findById(qrId);
        if (!qrExists) {
            return NextResponse.json(
                { success: false, message: "QR Code not found" },
                { status: 404 }
            );
        }

        const objectId = new mongoose.Types.ObjectId(qrId);

        // Aggregation Pipeline for Analytics
        const stats = await ScanLog.aggregate([
            { $match: { qrCodeId: objectId } },
            {
                $facet: {
                    totalScans: [{ $count: "count" }],
                    uniqueScans: [
                        { $group: { _id: "$ipAddress" } },
                        { $count: "count" }
                    ],
                    scansByDate: [
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$scannedAt" } },
                                count: { $sum: 1 },
                            },
                        },
                        { $sort: { _id: 1 } }, // Sort by date ascending
                    ],
                    deviceBreakdown: [
                        {
                            $group: {
                                _id: "$deviceType",
                                count: { $sum: 1 },
                            },
                        },
                    ],
                    countryBreakdown: [
                        {
                            $group: {
                                _id: "$country",
                                count: { $sum: 1 },
                            },
                        },
                        { $sort: { count: -1 } }, // Most popular countries first
                        { $limit: 10 }
                    ],
                },
            },
        ]);

        // Format the output
        const data = stats[0];
        const totalScans = data.totalScans[0]?.count || 0;
        const uniqueScans = data.uniqueScans[0]?.count || 0;

        // Format scansByDate
        const scansByDate = data.scansByDate.map((item: any) => ({
            date: item._id,
            count: item.count,
        }));

        // Format deviceBreakdown
        const deviceBreakdown = data.deviceBreakdown.reduce((acc: any, item: any) => {
            acc[item._id || "unknown"] = item.count;
            return acc;
        }, {});

        // Format countryBreakdown
        const countryBreakdown = data.countryBreakdown.map((item: any) => ({
            country: item._id || "Unknown",
            count: item.count,
        }));

        return NextResponse.json({
            success: true,
            data: {
                totalScans,
                uniqueScans,
                scansByDate,
                deviceBreakdown,
                countryBreakdown,
            },
        });

    } catch (error) {
        console.error("Stats API Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error", error: String(error) },
            { status: 500 }
        );
    }
}
