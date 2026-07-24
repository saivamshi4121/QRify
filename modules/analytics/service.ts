import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import QRCode from "@/models/QRCode";
import ScanLog from "@/models/ScanLog";
import FeedbackResponse from "@/models/FeedbackResponse";
import SmartPage from "@/models/SmartPage";
import { BadRequestError } from "@/core/errors/AppError";
import {
    AnalyticsRangePreset,
} from "@/modules/analytics/validation";
import { FeedbackRoutingResult } from "@/modules/feedback/constants";

export type DateWindow = {
    start: Date;
    end: Date;
    preset: AnalyticsRangePreset;
};

function startOfUtcDay(d: Date) {
    return new Date(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
    );
}

function endOfUtcDay(d: Date) {
    return new Date(
        Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate(),
            23,
            59,
            59,
            999
        )
    );
}

export function resolveDateWindow(
    preset: AnalyticsRangePreset,
    from?: string,
    to?: string
): DateWindow {
    const now = new Date();

    if (preset === "today") {
        return {
            start: startOfUtcDay(now),
            end: endOfUtcDay(now),
            preset,
        };
    }

    if (preset === "7d") {
        const end = endOfUtcDay(now);
        const start = startOfUtcDay(
            new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000)
        );
        return { start, end, preset };
    }

    if (preset === "30d") {
        const end = endOfUtcDay(now);
        const start = startOfUtcDay(
            new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000)
        );
        return { start, end, preset };
    }

    if (!from || !to) {
        throw new BadRequestError("Custom range requires from and to dates");
    }

    const start = startOfUtcDay(new Date(from));
    const end = endOfUtcDay(new Date(to));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new BadRequestError("Invalid from/to date");
    }
    if (start > end) {
        throw new BadRequestError("`from` must be before `to`");
    }

    return { start, end, preset: "custom" };
}

/** Previous window of equal length, ending just before current start. */
export function previousEquivalentWindow(current: DateWindow): DateWindow {
    const durationMs = current.end.getTime() - current.start.getTime();
    const end = new Date(current.start.getTime() - 1);
    const start = new Date(end.getTime() - durationMs);
    return { start, end, preset: current.preset };
}

function pctChange(current: number, previous: number): number | null {
    if (previous === 0) {
        if (current === 0) return 0;
        return null; // no baseline
    }
    return Math.round(((current - previous) / previous) * 1000) / 10;
}

function safeRate(numerator: number, denominator: number): number | null {
    if (denominator <= 0) return null;
    return Math.round((numerator / denominator) * 1000) / 10;
}

type PeriodMetrics = {
    totalScans: number;
    reviewPageVisits: number;
    ratingsSubmitted: number;
    averageRating: number | null;
    googleReviewClicks: number;
    privateFeedbackCount: number;
    responseRate: number | null;
};

async function metricsForPeriod(
    workspaceObjectId: mongoose.Types.ObjectId,
    qrIds: mongoose.Types.ObjectId[],
    reviewPageQrIds: mongoose.Types.ObjectId[],
    window: DateWindow
): Promise<PeriodMetrics> {
    const scanMatch = {
        qrCodeId: { $in: qrIds },
        scannedAt: { $gte: window.start, $lte: window.end },
    };

    const feedbackMatch = {
        workspaceId: workspaceObjectId,
        createdAt: { $gte: window.start, $lte: window.end },
    };

    const [
        totalScans,
        reviewPageVisits,
        feedbackAgg,
        googleReviewClicks,
        privateFeedbackCount,
    ] = await Promise.all([
        qrIds.length === 0
            ? Promise.resolve(0)
            : ScanLog.countDocuments(scanMatch),
        reviewPageQrIds.length === 0
            ? Promise.resolve(0)
            : ScanLog.countDocuments({
                  qrCodeId: { $in: reviewPageQrIds },
                  scannedAt: { $gte: window.start, $lte: window.end },
              }),
        FeedbackResponse.aggregate<{
            count: number;
            avgRating: number | null;
        }>([
            { $match: feedbackMatch },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    avgRating: { $avg: "$ratingScore" },
                },
            },
        ]),
        FeedbackResponse.countDocuments({
            ...feedbackMatch,
            reviewClicked: true,
        }),
        FeedbackResponse.countDocuments({
            ...feedbackMatch,
            routingResult: FeedbackRoutingResult.PRIVATE_FEEDBACK,
        }),
    ]);

    const ratingsSubmitted = feedbackAgg[0]?.count ?? 0;
    const avg = feedbackAgg[0]?.avgRating;
    const averageRating =
        typeof avg === "number"
            ? Math.round(avg * 10) / 10
            : null;

    return {
        totalScans,
        reviewPageVisits,
        ratingsSubmitted,
        averageRating,
        googleReviewClicks,
        privateFeedbackCount,
        responseRate: safeRate(ratingsSubmitted, reviewPageVisits),
    };
}

export async function getAnalyticsOverview(
    workspaceId: string,
    preset: AnalyticsRangePreset,
    from?: string,
    to?: string
) {
    await dbConnect();

    const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
    const current = resolveDateWindow(preset, from, to);
    const previous = previousEquivalentWindow(current);

    const workspaceQrs = await QRCode.find({ workspaceId: workspaceObjectId })
        .select("_id qrName smartPageId")
        .lean();

    const qrIds = workspaceQrs.map((q) => q._id as mongoose.Types.ObjectId);
    const reviewPageQrIds = workspaceQrs
        .filter((q) => q.smartPageId)
        .map((q) => q._id as mongoose.Types.ObjectId);

    const qrNameMap = new Map(
        workspaceQrs.map((q) => [String(q._id), q.qrName as string])
    );

    const [currentMetrics, previousMetrics, ratingDistRaw, topQrRaw, topPagesRaw, recentRaw] =
        await Promise.all([
            metricsForPeriod(
                workspaceObjectId,
                qrIds,
                reviewPageQrIds,
                current
            ),
            metricsForPeriod(
                workspaceObjectId,
                qrIds,
                reviewPageQrIds,
                previous
            ),
            FeedbackResponse.aggregate<{ _id: number; count: number }>([
                {
                    $match: {
                        workspaceId: workspaceObjectId,
                        createdAt: {
                            $gte: current.start,
                            $lte: current.end,
                        },
                    },
                },
                { $group: { _id: "$ratingScore", count: { $sum: 1 } } },
            ]),
            qrIds.length === 0
                ? Promise.resolve(
                      [] as { _id: mongoose.Types.ObjectId; scans: number }[]
                  )
                : ScanLog.aggregate<{
                      _id: mongoose.Types.ObjectId;
                      scans: number;
                  }>([
                      {
                          $match: {
                              qrCodeId: { $in: qrIds },
                              scannedAt: {
                                  $gte: current.start,
                                  $lte: current.end,
                              },
                          },
                      },
                      { $group: { _id: "$qrCodeId", scans: { $sum: 1 } } },
                      { $sort: { scans: -1 } },
                      { $limit: 5 },
                  ]),
            FeedbackResponse.aggregate<{
                _id: mongoose.Types.ObjectId;
                responses: number;
                googleClicks: number;
            }>([
                {
                    $match: {
                        workspaceId: workspaceObjectId,
                        createdAt: {
                            $gte: current.start,
                            $lte: current.end,
                        },
                    },
                },
                {
                    $group: {
                        _id: "$smartPageId",
                        responses: { $sum: 1 },
                        googleClicks: {
                            $sum: {
                                $cond: [{ $eq: ["$reviewClicked", true] }, 1, 0],
                            },
                        },
                    },
                },
                { $sort: { responses: -1 } },
                { $limit: 5 },
            ]),
            FeedbackResponse.find({
                workspaceId: workspaceObjectId,
                createdAt: { $gte: current.start, $lte: current.end },
            })
                .sort({ createdAt: -1 })
                .limit(10)
                .select(
                    "ratingScore routingResult reviewClicked commentText createdAt smartPageId category status"
                )
                .lean(),
        ]);

    const distMap = new Map(
        ratingDistRaw.map((r) => [r._id, r.count] as const)
    );
    const ratingDistribution = [1, 2, 3, 4, 5].map((score) => ({
        score,
        count: distMap.get(score) ?? 0,
    }));

    // Review page visits by smartPageId (via linked QRs) for conversion %
    const pageIdToQrIds = new Map<string, mongoose.Types.ObjectId[]>();
    for (const q of workspaceQrs) {
        if (!q.smartPageId) continue;
        const key = String(q.smartPageId);
        const list = pageIdToQrIds.get(key) || [];
        list.push(q._id as mongoose.Types.ObjectId);
        pageIdToQrIds.set(key, list);
    }

    const topPageIds = topPagesRaw.map((p) => p._id);
    const pages = topPageIds.length
        ? await SmartPage.find({
              _id: { $in: topPageIds },
              workspaceId: workspaceObjectId,
          })
              .select("_id title slug")
              .lean()
        : [];
    const pageMap = new Map(pages.map((p) => [String(p._id), p]));

    const visitCountsByPage = await Promise.all(
        topPagesRaw.map(async (row) => {
            const linked = pageIdToQrIds.get(String(row._id)) || [];
            if (linked.length === 0) return { id: String(row._id), visits: 0 };
            const visits = await ScanLog.countDocuments({
                qrCodeId: { $in: linked },
                scannedAt: { $gte: current.start, $lte: current.end },
            });
            return { id: String(row._id), visits };
        })
    );
    const visitsMap = new Map(visitCountsByPage.map((v) => [v.id, v.visits]));

    const topSmartPages = topPagesRaw.map((row) => {
        const id = String(row._id);
        const meta = pageMap.get(id);
        const visits = visitsMap.get(id) ?? 0;
        return {
            smartPageId: id,
            title: meta?.title || "Untitled page",
            slug: meta?.slug || "",
            responses: row.responses,
            googleReviewClicks: row.googleClicks,
            reviewPageVisits: visits,
            /** Ratings submitted ÷ Review Page Visits (QR) */
            responseRate: safeRate(row.responses, visits),
            /** Google clicks ÷ Ratings submitted */
            googleConversionRate: safeRate(row.googleClicks, row.responses),
        };
    });

    const recentPageIds = [
        ...new Set(recentRaw.map((r) => String(r.smartPageId))),
    ];
    const recentPages =
        recentPageIds.length > 0
            ? await SmartPage.find({
                  _id: { $in: recentPageIds },
                  workspaceId: workspaceObjectId,
              })
                  .select("_id title")
                  .lean()
            : [];
    const recentPageMap = new Map(
        recentPages.map((p) => [String(p._id), p.title as string])
    );

    const recentFeedback = recentRaw.map((r) => ({
        id: String(r._id),
        ratingScore: r.ratingScore,
        routingResult: r.routingResult,
        reviewClicked: r.reviewClicked,
        commentText: r.commentText || "",
        category: r.category || "",
        status: r.status,
        createdAt: r.createdAt,
        pageTitle: recentPageMap.get(String(r.smartPageId)) || "Review page",
    }));

    const summary = {
        totalScans: currentMetrics.totalScans,
        reviewPageVisits: currentMetrics.reviewPageVisits,
        ratingsSubmitted: currentMetrics.ratingsSubmitted,
        averageRating: currentMetrics.averageRating,
        googleReviewClicks: currentMetrics.googleReviewClicks,
        privateFeedbackCount: currentMetrics.privateFeedbackCount,
        responseRate: currentMetrics.responseRate,
        changes: {
            totalScans: pctChange(
                currentMetrics.totalScans,
                previousMetrics.totalScans
            ),
            reviewPageVisits: pctChange(
                currentMetrics.reviewPageVisits,
                previousMetrics.reviewPageVisits
            ),
            ratingsSubmitted: pctChange(
                currentMetrics.ratingsSubmitted,
                previousMetrics.ratingsSubmitted
            ),
            averageRating: pctChange(
                currentMetrics.averageRating ?? 0,
                previousMetrics.averageRating ?? 0
            ),
            googleReviewClicks: pctChange(
                currentMetrics.googleReviewClicks,
                previousMetrics.googleReviewClicks
            ),
            privateFeedbackCount: pctChange(
                currentMetrics.privateFeedbackCount,
                previousMetrics.privateFeedbackCount
            ),
            responseRate: pctChange(
                currentMetrics.responseRate ?? 0,
                previousMetrics.responseRate ?? 0
            ),
        },
    };

    const funnel = {
        qrScans: currentMetrics.totalScans,
        ratingsSubmitted: currentMetrics.ratingsSubmitted,
        googleReviewClicks: currentMetrics.googleReviewClicks,
        scanToRatingRate: safeRate(
            currentMetrics.ratingsSubmitted,
            currentMetrics.totalScans
        ),
        ratingToGoogleRate: safeRate(
            currentMetrics.googleReviewClicks,
            currentMetrics.ratingsSubmitted
        ),
    };

    return {
        range: {
            preset: current.preset,
            start: current.start.toISOString(),
            end: current.end.toISOString(),
            previousStart: previous.start.toISOString(),
            previousEnd: previous.end.toISOString(),
        },
        summary,
        funnel,
        ratingDistribution,
        topQrCodes: topQrRaw.map((row) => ({
            qrCodeId: String(row._id),
            qrName: qrNameMap.get(String(row._id)) || "Untitled QR",
            scans: row.scans,
        })),
        topSmartPages,
        recentFeedback,
    };
}
