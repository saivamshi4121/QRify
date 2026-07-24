import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import ScanLog from "@/models/ScanLog";
import QRCode from "@/models/QRCode";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { NotFoundError, BadRequestError } from "@/core/errors/AppError";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ qrId: string }> | { qrId: string } }
) {
    try {
        const { workspaceId } = await resolveWorkspace();

        await dbConnect();
        const resolvedParams = params instanceof Promise ? await params : params;
        const { qrId } = resolvedParams;

        if (!mongoose.Types.ObjectId.isValid(qrId)) {
            throw new BadRequestError("Invalid QR ID");
        }

        const qrExists = await QRCode.findOne({
            _id: qrId,
            workspaceId,
        });
        if (!qrExists) {
            throw new NotFoundError("QR Code not found");
        }

        const objectId = new mongoose.Types.ObjectId(qrId);

        const stats = await ScanLog.aggregate([
            { $match: { qrCodeId: objectId } },
            {
                $facet: {
                    totalScans: [{ $count: "count" }],
                    uniqueScans: [
                        { $group: { _id: "$ipAddress" } },
                        { $count: "count" },
                    ],
                    scansByDate: [
                        {
                            $group: {
                                _id: {
                                    $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: "$scannedAt",
                                    },
                                },
                                count: { $sum: 1 },
                            },
                        },
                        { $sort: { _id: 1 } },
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
                        { $sort: { count: -1 } },
                        { $limit: 10 },
                    ],
                },
            },
        ]);

        const data = stats[0];
        const totalScans = data.totalScans[0]?.count || 0;
        const uniqueScans = data.uniqueScans[0]?.count || 0;

        const scansByDate = data.scansByDate.map(
            (item: { _id: string; count: number }) => ({
                date: item._id,
                count: item.count,
            })
        );

        const deviceBreakdown = data.deviceBreakdown.reduce(
            (
                acc: Record<string, number>,
                item: { _id: string | null; count: number }
            ) => {
                acc[item._id || "unknown"] = item.count;
                return acc;
            },
            {}
        );

        const countryBreakdown = data.countryBreakdown.map(
            (item: { _id: string | null; count: number }) => ({
                country: item._id || "Unknown",
                count: item.count,
            })
        );

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
        return handleApiError(error, "Stats API Error");
    }
}
