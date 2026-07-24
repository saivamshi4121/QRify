"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Activity,
    BarChart3,
    Loader2,
    MessageSquare,
    QrCode,
    Star,
    ThumbsUp,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { SectionCard } from "@/app/(dashboard)/_components/SectionCard";
import { cn } from "@/lib/utils";

type RangePreset = "today" | "7d" | "30d" | "custom";

type AnalyticsData = {
    range: {
        preset: RangePreset;
        start: string;
        end: string;
    };
    summary: {
        totalScans: number;
        reviewPageVisits: number;
        ratingsSubmitted: number;
        averageRating: number | null;
        googleReviewClicks: number;
        privateFeedbackCount: number;
        responseRate: number | null;
        changes: Record<string, number | null>;
    };
    funnel: {
        qrScans: number;
        ratingsSubmitted: number;
        googleReviewClicks: number;
        scanToRatingRate: number | null;
        ratingToGoogleRate: number | null;
    };
    ratingDistribution: Array<{ score: number; count: number }>;
    topQrCodes: Array<{ qrCodeId: string; qrName: string; scans: number }>;
    topSmartPages: Array<{
        smartPageId: string;
        title: string;
        slug: string;
        responses: number;
        googleReviewClicks: number;
        reviewPageVisits: number;
        responseRate: number | null;
        googleConversionRate: number | null;
    }>;
    recentFeedback: Array<{
        id: string;
        ratingScore: number;
        routingResult: string;
        reviewClicked: boolean;
        commentText: string;
        category: string;
        status: string;
        createdAt: string;
        pageTitle: string;
    }>;
};

const RANGE_OPTIONS: { id: RangePreset; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
    { id: "custom", label: "Custom" },
];

function formatPct(value: number | null | undefined) {
    if (value === null || value === undefined) return "—";
    return `${value}%`;
}

function ChangeBadge({ value }: { value: number | null | undefined }) {
    if (value === null || value === undefined) {
        return (
            <span className="text-xs text-slate-400">vs prior period —</span>
        );
    }
    const up = value > 0;
    const flat = value === 0;
    return (
        <span
            className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                flat
                    ? "text-slate-400"
                    : up
                      ? "text-emerald-600"
                      : "text-rose-600"
            )}
        >
            {!flat &&
                (up ? (
                    <TrendingUp className="h-3 w-3" />
                ) : (
                    <TrendingDown className="h-3 w-3" />
                ))}
            {up ? "+" : ""}
            {value}% vs prior
        </span>
    );
}

function KpiCard({
    title,
    value,
    change,
    icon,
    hint,
}: {
    title: string;
    value: string;
    change?: number | null;
    icon: React.ReactNode;
    hint?: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                        {value}
                    </p>
                    <div className="mt-2">
                        <ChangeBadge value={change} />
                    </div>
                    {hint ? (
                        <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
                    ) : null}
                </div>
                <div className="rounded-full bg-slate-100 p-2.5 text-slate-600">
                    {icon}
                </div>
            </div>
        </div>
    );
}

function EmptyBlock({ message }: { message: string }) {
    return (
        <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-400">
            {message}
        </div>
    );
}

function toInputDate(iso: string) {
    return iso.slice(0, 10);
}

export default function AnalyticsPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [range, setRange] = useState<RangePreset>("7d");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    const queryString = useMemo(() => {
        const params = new URLSearchParams({ range });
        if (range === "custom" && customFrom && customTo) {
            params.set("from", customFrom);
            params.set("to", customTo);
        }
        return params.toString();
    }, [range, customFrom, customTo]);

    const fetchAnalytics = useCallback(async () => {
        if (range === "custom" && (!customFrom || !customTo)) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/v2/analytics/overview?${queryString}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to load");
            setData(json.data);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [queryString, range, customFrom, customTo]);

    useEffect(() => {
        if (session && status === "authenticated") {
            fetchAnalytics();
        }
    }, [session, status, fetchAnalytics]);

    const maxDist = Math.max(
        ...(data?.ratingDistribution.map((d) => d.count) || [0]),
        1
    );

    const funnelMax = Math.max(
        data?.funnel.qrScans || 0,
        data?.funnel.ratingsSubmitted || 0,
        data?.funnel.googleReviewClicks || 0,
        1
    );

    if (status === "loading" || (loading && !data)) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <Toaster richColors position="top-right" />

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Analytics
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Scans, ratings, and review performance for this
                        workspace.
                    </p>
                </div>

                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                    <div
                        className="inline-flex rounded-lg bg-slate-100 p-1"
                        role="group"
                        aria-label="Date range"
                    >
                        {RANGE_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setRange(opt.id)}
                                className={cn(
                                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                    range === opt.id
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {range === "custom" ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="date"
                                value={customFrom}
                                onChange={(e) => setCustomFrom(e.target.value)}
                                className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                            />
                            <span className="text-xs text-slate-400">to</span>
                            <input
                                type="date"
                                value={customTo}
                                onChange={(e) => setCustomTo(e.target.value)}
                                className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                            />
                        </div>
                    ) : data ? (
                        <p className="text-xs text-slate-400">
                            {toInputDate(data.range.start)} –{" "}
                            {toInputDate(data.range.end)} (UTC)
                        </p>
                    ) : null}
                </div>
            </div>

            {loading && data ? (
                <p className="text-sm text-slate-400">Updating…</p>
            ) : null}

            {!data ? (
                <EmptyBlock message="Pick a date range to see analytics." />
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <KpiCard
                            title="Total QR Scans"
                            value={data.summary.totalScans.toLocaleString()}
                            change={data.summary.changes.totalScans}
                            icon={<QrCode className="h-5 w-5" />}
                        />
                        <KpiCard
                            title="Review Page Visits (QR)"
                            value={data.summary.reviewPageVisits.toLocaleString()}
                            change={data.summary.changes.reviewPageVisits}
                            icon={<Activity className="h-5 w-5" />}
                            hint="Scans of QRs linked to a review page"
                        />
                        <KpiCard
                            title="Average Rating"
                            value={
                                data.summary.averageRating !== null
                                    ? data.summary.averageRating.toFixed(1)
                                    : "—"
                            }
                            change={data.summary.changes.averageRating}
                            icon={<Star className="h-5 w-5" />}
                        />
                        <KpiCard
                            title="Google Review Clicks"
                            value={data.summary.googleReviewClicks.toLocaleString()}
                            change={data.summary.changes.googleReviewClicks}
                            icon={<ThumbsUp className="h-5 w-5" />}
                        />
                        <KpiCard
                            title="Private Feedback"
                            value={data.summary.privateFeedbackCount.toLocaleString()}
                            change={data.summary.changes.privateFeedbackCount}
                            icon={<MessageSquare className="h-5 w-5" />}
                        />
                        <KpiCard
                            title="Response Rate"
                            value={formatPct(data.summary.responseRate)}
                            change={data.summary.changes.responseRate}
                            icon={<BarChart3 className="h-5 w-5" />}
                            hint="Ratings submitted ÷ Review Page Visits (QR)"
                        />
                    </div>

                    <SectionCard
                        title="Conversion funnel"
                        description="QR Scans → Ratings Submitted → Google Review Clicks"
                    >
                        {data.funnel.qrScans === 0 &&
                        data.funnel.ratingsSubmitted === 0 ? (
                            <EmptyBlock message="No funnel activity in this period yet. Link a QR to a review page and collect a few ratings." />
                        ) : (
                            <div className="space-y-4">
                                {[
                                    {
                                        label: "QR Scans",
                                        value: data.funnel.qrScans,
                                        rate: null as number | null,
                                    },
                                    {
                                        label: "Ratings Submitted",
                                        value: data.funnel.ratingsSubmitted,
                                        rate: data.funnel.scanToRatingRate,
                                    },
                                    {
                                        label: "Google Review Clicks",
                                        value: data.funnel.googleReviewClicks,
                                        rate: data.funnel.ratingToGoogleRate,
                                    },
                                ].map((step) => (
                                    <div key={step.label}>
                                        <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                                            <span className="font-medium text-slate-700">
                                                {step.label}
                                            </span>
                                            <span className="tabular-nums text-slate-900">
                                                {step.value.toLocaleString()}
                                                {step.rate !== null ? (
                                                    <span className="ml-2 text-xs font-normal text-slate-400">
                                                        ({formatPct(step.rate)}{" "}
                                                        of previous)
                                                    </span>
                                                ) : null}
                                            </span>
                                        </div>
                                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-indigo-500"
                                                style={{
                                                    width: `${Math.max(
                                                        4,
                                                        (step.value /
                                                            funnelMax) *
                                                            100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SectionCard>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <SectionCard
                            title="Rating distribution"
                            description="How guests scored you (1–5 stars)"
                        >
                            {data.ratingDistribution.every((d) => d.count === 0) ? (
                                <EmptyBlock message="No ratings in this period. Distribution will appear once guests submit stars." />
                            ) : (
                                <div className="space-y-3">
                                    {[...data.ratingDistribution]
                                        .reverse()
                                        .map((row) => (
                                            <div
                                                key={row.score}
                                                className="flex items-center gap-3"
                                            >
                                                <span className="w-12 shrink-0 text-sm text-slate-600">
                                                    {row.score}★
                                                </span>
                                                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full bg-amber-400"
                                                        style={{
                                                            width: `${
                                                                (row.count /
                                                                    maxDist) *
                                                                100
                                                            }%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="w-8 shrink-0 text-right text-sm tabular-nums text-slate-700">
                                                    {row.count}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </SectionCard>

                        <SectionCard
                            title="Top QR codes"
                            description="Most scanned in this period"
                        >
                            {data.topQrCodes.length === 0 ? (
                                <EmptyBlock message="No QR scans yet in this period." />
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {data.topQrCodes.map((qr, i) => (
                                        <li
                                            key={qr.qrCodeId}
                                            className="flex items-center justify-between gap-3 py-2.5 text-sm"
                                        >
                                            <span className="min-w-0 truncate text-slate-800">
                                                <span className="mr-2 text-slate-400">
                                                    {i + 1}.
                                                </span>
                                                {qr.qrName}
                                            </span>
                                            <span className="shrink-0 tabular-nums font-medium text-slate-900">
                                                {qr.scans.toLocaleString()} scans
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </SectionCard>
                    </div>

                    <SectionCard
                        title="Top review pages"
                        description="By ratings submitted — with conversion rates"
                    >
                        {data.topSmartPages.length === 0 ? (
                            <EmptyBlock message="No review page activity yet. Publish a page and link a QR to start measuring." />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-2 py-2 font-medium">
                                                Page
                                            </th>
                                            <th className="px-2 py-2 font-medium">
                                                Visits (QR)
                                            </th>
                                            <th className="px-2 py-2 font-medium">
                                                Ratings
                                            </th>
                                            <th className="px-2 py-2 font-medium">
                                                Response rate
                                            </th>
                                            <th className="px-2 py-2 font-medium">
                                                Google clicks
                                            </th>
                                            <th className="px-2 py-2 font-medium">
                                                Google conv.
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.topSmartPages.map((page) => (
                                            <tr key={page.smartPageId}>
                                                <td className="px-2 py-2.5 font-medium text-slate-900">
                                                    {page.title}
                                                    {page.slug ? (
                                                        <span className="mt-0.5 block text-xs font-normal text-slate-400">
                                                            /p/{page.slug}
                                                        </span>
                                                    ) : null}
                                                </td>
                                                <td className="px-2 py-2.5 tabular-nums text-slate-700">
                                                    {page.reviewPageVisits}
                                                </td>
                                                <td className="px-2 py-2.5 tabular-nums text-slate-700">
                                                    {page.responses}
                                                </td>
                                                <td className="px-2 py-2.5 tabular-nums text-slate-700">
                                                    {formatPct(page.responseRate)}
                                                </td>
                                                <td className="px-2 py-2.5 tabular-nums text-slate-700">
                                                    {page.googleReviewClicks}
                                                </td>
                                                <td className="px-2 py-2.5 tabular-nums text-slate-700">
                                                    {formatPct(
                                                        page.googleConversionRate
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Recent feedback"
                        description="Latest ratings in this period"
                    >
                        {data.recentFeedback.length === 0 ? (
                            <EmptyBlock message="No feedback activity in this period." />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-2 py-2 font-medium">
                                                When
                                            </th>
                                            <th className="px-2 py-2 font-medium">
                                                Page
                                            </th>
                                            <th className="px-2 py-2 font-medium">
                                                Rating
                                            </th>
                                            <th className="px-2 py-2 font-medium">
                                                Path
                                            </th>
                                            <th className="px-2 py-2 font-medium">
                                                Note
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.recentFeedback.map((row) => (
                                            <tr key={row.id}>
                                                <td className="px-2 py-2.5 whitespace-nowrap text-xs text-slate-400">
                                                    {new Date(
                                                        row.createdAt
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="px-2 py-2.5 text-slate-700">
                                                    {row.pageTitle}
                                                </td>
                                                <td className="px-2 py-2.5 tabular-nums text-slate-900">
                                                    {row.ratingScore}★
                                                </td>
                                                <td className="px-2 py-2.5 text-slate-600">
                                                    {row.routingResult ===
                                                    "google_review"
                                                        ? row.reviewClicked
                                                            ? "Google (clicked)"
                                                            : "Google"
                                                        : "Private"}
                                                </td>
                                                <td className="max-w-xs truncate px-2 py-2.5 text-slate-500">
                                                    {row.commentText || "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </SectionCard>
                </>
            )}
        </div>
    );
}
