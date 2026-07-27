"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
    ACCESS_RESULT_VALUES,
    ACCESS_TYPE_VALUES,
} from "@/modules/access-event/constants";

type AccessRow = {
    id: string;
    type: string;
    result: string;
    gate: string;
    occurredAt: string;
    attendee: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    } | null;
    operator: { name: string | null; email: string | null } | null;
};

type Pagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

const resultStyles: Record<string, string> = {
    SUCCESS: "bg-emerald-50 text-emerald-700",
    ALREADY_ENTERED: "bg-amber-50 text-amber-800",
    DENIED: "bg-rose-50 text-rose-700",
    INVALID_CREDENTIAL: "bg-rose-50 text-rose-700",
    REVOKED_CREDENTIAL: "bg-rose-50 text-rose-700",
    EXPIRED_CREDENTIAL: "bg-rose-50 text-rose-700",
    EVENT_NOT_OPEN: "bg-slate-100 text-slate-600",
};

export default function EventAccessPage() {
    const params = useParams();
    const eventId = String(params.eventId);
    const { data: session, status } = useSession();
    const router = useRouter();

    const [eventName, setEventName] = useState("");
    const [items, setItems] = useState<AccessRow[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 1,
    });
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [resultFilter, setResultFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [gateFilter, setGateFilter] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    useEffect(() => {
        if (!session) return;
        fetch(`/api/v2/events/${eventId}`)
            .then((r) => r.json())
            .then((json) => {
                if (json.success) setEventName(json.data.name);
            })
            .catch(() => undefined);
    }, [session, eventId]);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "25",
            });
            if (q.trim()) params.set("q", q.trim());
            if (resultFilter) params.set("result", resultFilter);
            if (typeFilter) params.set("type", typeFilter);
            if (gateFilter.trim()) params.set("gate", gateFilter.trim());

            const res = await fetch(
                `/api/v2/events/${eventId}/access?${params}`
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to load");
            setItems(json.data.items || []);
            setPagination(json.data.pagination);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, [eventId, page, q, resultFilter, typeFilter, gateFilter]);

    useEffect(() => {
        if (session) fetchRows();
    }, [session, fetchRows]);

    return (
        <div className="space-y-6">
            <Toaster richColors position="top-right" />

            <div className="flex items-start gap-3">
                <Link
                    href={`/events/${eventId}`}
                    className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Access log
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {eventName || "Event"} · {pagination.total} events
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
                <input
                    type="search"
                    placeholder="Search attendee…"
                    value={q}
                    onChange={(e) => {
                        setPage(1);
                        setQ(e.target.value);
                    }}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 lg:max-w-xs"
                />
                <input
                    type="text"
                    placeholder="Gate"
                    value={gateFilter}
                    onChange={(e) => {
                        setPage(1);
                        setGateFilter(e.target.value);
                    }}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm lg:w-36"
                />
                <select
                    value={typeFilter}
                    onChange={(e) => {
                        setPage(1);
                        setTypeFilter(e.target.value);
                    }}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                    <option value="">All types</option>
                    {ACCESS_TYPE_VALUES.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
                <select
                    value={resultFilter}
                    onChange={(e) => {
                        setPage(1);
                        setResultFilter(e.target.value);
                    }}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                    <option value="">All results</option>
                    {ACCESS_RESULT_VALUES.map((r) => (
                        <option key={r} value={r}>
                            {r}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : items.length === 0 ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                    No access events yet. Use Manual Check-in on an attendee, or
                    validate a credential token.
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Time
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Attendee
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Gate
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Result
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Operator
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map((row) => (
                                    <tr key={row.id}>
                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                                            {new Date(
                                                row.occurredAt
                                            ).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.attendee ? (
                                                <Link
                                                    href={`/events/${eventId}/attendees/${row.attendee.id}`}
                                                    className="font-medium text-slate-900 hover:text-indigo-600"
                                                >
                                                    {row.attendee.firstName}{" "}
                                                    {row.attendee.lastName}
                                                    <span className="mt-0.5 block text-xs font-normal text-slate-400">
                                                        {row.attendee.email}
                                                    </span>
                                                </Link>
                                            ) : (
                                                <span className="text-slate-400">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">
                                            {row.gate}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">
                                            {row.type}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    resultStyles[row.result] ||
                                                    "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {row.result}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {row.operator?.name ||
                                                row.operator?.email ||
                                                "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
                        <span>
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="rounded-md border border-slate-200 px-3 py-1 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="rounded-md border border-slate-200 px-3 py-1 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
