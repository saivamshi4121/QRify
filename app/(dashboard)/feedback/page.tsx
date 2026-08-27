"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare } from "lucide-react";
import { toast, Toaster } from "sonner";
import { SectionCard } from "@/app/(dashboard)/_components/SectionCard";
import {
    FeedbackStatus,
    FeedbackStatusValue,
    FeedbackRoutingResult,
} from "@/modules/feedback/constants";

type FeedbackRow = {
    _id: string;
    ratingScore: number;
    category?: string;
    commentText?: string;
    customerName?: string;
    customerPhone?: string;
    locationTag?: string;
    status: FeedbackStatusValue;
    routingResult: string;
    reviewClicked?: boolean;
    smartPageTitle?: string;
    createdAt: string;
};

const STATUS_OPTIONS: FeedbackStatusValue[] = [
    FeedbackStatus.NEW,
    FeedbackStatus.ACKNOWLEDGED,
    FeedbackStatus.RESOLVED,
];

export default function FeedbackDashboardPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [rows, setRows] = useState<FeedbackRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        if (authStatus === "unauthenticated") {
            router.replace("/login");
        }
    }, [authStatus, router]);

    const fetchRows = useCallback(async () => {
        try {
            const qs =
                statusFilter !== "all" ? `?status=${statusFilter}` : "";
            const res = await fetch(`/api/v2/feedback/responses${qs}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to load");
            setRows(json.data || []);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load feedback");
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        if (session) {
            setLoading(true);
            fetchRows();
        }
    }, [session, fetchRows]);

    async function updateStatus(id: string, status: FeedbackStatusValue) {
        try {
            const res = await fetch(`/api/v2/feedback/responses/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Update failed");
            toast.success("Status updated");
            fetchRows();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Update failed");
        }
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Toaster richColors position="top-right" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Feedback</h1>
                    <p className="mt-2 text-slate-500">
                        Ratings and private comments from your Review Pages.
                    </p>
                </div>
                <label className="text-sm text-slate-600">
                    Status{" "}
                    <select
                        className="ml-2 rounded-md border border-white/[0.08] px-3 py-2 text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All</option>
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <SectionCard
                title="Responses"
                description={`${rows.length} feedback record${rows.length === 1 ? "" : "s"}`}
            >
                {rows.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                        <MessageSquare className="h-8 w-8" />
                        <p className="text-sm">No feedback yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-white/[0.08] text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Rating</th>
                                    <th className="px-3 py-2 font-medium">Comment</th>
                                    <th className="px-3 py-2 font-medium">Page</th>
                                    <th className="px-3 py-2 font-medium">Route</th>
                                    <th className="px-3 py-2 font-medium">Status</th>
                                    <th className="px-3 py-2 font-medium">When</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.06]">
                                {rows.map((row) => (
                                    <tr key={row._id} className="align-top">
                                        <td className="px-3 py-3 font-semibold text-amber-500">
                                            {"★".repeat(row.ratingScore)}
                                            <span className="ml-1 text-xs text-slate-400">
                                                {row.ratingScore}/5
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 max-w-xs">
                                            {row.category ? (
                                                <span className="mb-1 inline-block rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-slate-300">
                                                    {row.category}
                                                </span>
                                            ) : null}
                                            <p className="text-slate-300">
                                                {row.commentText || "—"}
                                            </p>
                                            {row.locationTag ? (
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {row.locationTag}
                                                </p>
                                            ) : null}
                                            {row.customerPhone ? (
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {row.customerPhone}
                                                </p>
                                            ) : null}
                                        </td>
                                        <td className="px-3 py-3 text-slate-600">
                                            {row.smartPageTitle || "—"}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-slate-500">
                                            {row.routingResult ===
                                            FeedbackRoutingResult.GOOGLE_REVIEW
                                                ? row.reviewClicked
                                                    ? "Google (clicked)"
                                                    : "Google"
                                                : "Private"}
                                        </td>
                                        <td className="px-3 py-3">
                                            <select
                                                className="rounded-md border border-white/[0.08] px-2 py-1 text-xs"
                                                value={row.status}
                                                onChange={(e) =>
                                                    updateStatus(
                                                        row._id,
                                                        e.target.value as FeedbackStatusValue
                                                    )
                                                }
                                            >
                                                {STATUS_OPTIONS.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-400">
                                            {new Date(row.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>
        </div>
    );
}
