"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ArrowLeft,
    Loader2,
    Plus,
    Trash2,
    Upload,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import {
    REGISTRATION_SOURCE_VALUES,
    REGISTRATION_STATUS_VALUES,
} from "@/modules/attendee/constants";

type AttendeeRow = {
    id: string;
    publicId: string;
    firstName: string;
    lastName: string;
    email: string;
    ticketType: string;
    registrationSource: string;
    registrationStatus: string;
    createdAt: string;
};

type Pagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export default function EventAttendeesPage() {
    const params = useParams();
    const eventId = String(params.eventId);
    const { data: session, status } = useSession();
    const router = useRouter();

    const [eventName, setEventName] = useState("");
    const [items, setItems] = useState<AttendeeRow[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
    });
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sourceFilter, setSourceFilter] = useState("");
    const [sort, setSort] = useState("createdAt_desc");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState(false);

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

    const fetchAttendees = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "20",
                sort,
            });
            if (q.trim()) params.set("q", q.trim());
            if (statusFilter) params.set("status", statusFilter);
            if (sourceFilter) params.set("source", sourceFilter);

            const res = await fetch(
                `/api/v2/events/${eventId}/attendees?${params}`
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to load");
            setItems(json.data.items || []);
            setPagination(json.data.pagination);
            setSelected(new Set());
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, [eventId, page, q, statusFilter, sourceFilter, sort]);

    useEffect(() => {
        if (session) fetchAttendees();
    }, [session, fetchAttendees]);

    function toggleAll(checked: boolean) {
        if (checked) setSelected(new Set(items.map((i) => i.publicId)));
        else setSelected(new Set());
    }

    function toggleOne(publicId: string, checked: boolean) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (checked) next.add(publicId);
            else next.delete(publicId);
            return next;
        });
    }

    async function bulkDelete() {
        if (selected.size === 0) return;
        if (
            !confirm(
                `Delete ${selected.size} attendee${selected.size === 1 ? "" : "s"}? This cannot be undone.`
            )
        ) {
            return;
        }
        setBusy(true);
        try {
            const res = await fetch(
                `/api/v2/events/${eventId}/attendees/bulk-delete`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ publicIds: [...selected] }),
                }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Delete failed");
            toast.success(`Deleted ${json.data.deleted} attendee(s)`);
            fetchAttendees();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Delete failed");
        } finally {
            setBusy(false);
        }
    }

    async function deleteOne(publicId: string, name: string) {
        if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
        setBusy(true);
        try {
            const res = await fetch(
                `/api/v2/events/${eventId}/attendees/${publicId}`,
                { method: "DELETE" }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Delete failed");
            toast.success("Deleted");
            fetchAttendees();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Delete failed");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-6">
            <Toaster richColors position="top-right" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-start gap-3">
                    <Link
                        href={`/events/${eventId}`}
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Attendees
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {eventName || "Event"} · {pagination.total} total
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/events/${eventId}/attendees/import`}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        <Upload className="h-4 w-4" />
                        Import CSV
                    </Link>
                    <Link
                        href={`/events/${eventId}/attendees/new`}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Add Attendee
                    </Link>
                </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
                <input
                    type="search"
                    placeholder="Search name, email, company…"
                    value={q}
                    onChange={(e) => {
                        setPage(1);
                        setQ(e.target.value);
                    }}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 lg:max-w-xs"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setPage(1);
                        setStatusFilter(e.target.value);
                    }}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                    <option value="">All statuses</option>
                    {REGISTRATION_STATUS_VALUES.map((s) => (
                        <option key={s} value={s}>
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                        </option>
                    ))}
                </select>
                <select
                    value={sourceFilter}
                    onChange={(e) => {
                        setPage(1);
                        setSourceFilter(e.target.value);
                    }}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                    <option value="">All sources</option>
                    {REGISTRATION_SOURCE_VALUES.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                    <option value="createdAt_desc">Newest</option>
                    <option value="createdAt_asc">Oldest</option>
                    <option value="name_asc">Name A–Z</option>
                    <option value="name_desc">Name Z–A</option>
                    <option value="email_asc">Email A–Z</option>
                </select>
            </div>

            {selected.size > 0 ? (
                <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm">
                    <span className="font-medium text-indigo-900">
                        {selected.size} selected
                    </span>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={bulkDelete}
                        className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete selected
                    </button>
                </div>
            ) : null}

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : items.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                    <h2 className="text-xl font-bold text-slate-900">
                        No attendees yet
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-slate-500">
                        Add people manually or import a CSV. QR tickets come in a
                        later milestone.
                    </p>
                    <div className="mt-6 flex gap-3">
                        <Link
                            href={`/events/${eventId}/attendees/new`}
                            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white"
                        >
                            Add Attendee
                        </Link>
                        <Link
                            href={`/events/${eventId}/attendees/import`}
                            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
                        >
                            Import CSV
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={
                                                items.length > 0 &&
                                                selected.size === items.length
                                            }
                                            onChange={(e) =>
                                                toggleAll(e.target.checked)
                                            }
                                        />
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Name
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Ticket
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Source
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Created
                                    </th>
                                    <th className="px-4 py-3 font-medium" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {items.map((row) => (
                                    <tr key={row.publicId} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(
                                                    row.publicId
                                                )}
                                                onChange={(e) =>
                                                    toggleOne(
                                                        row.publicId,
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/events/${eventId}/attendees/${row.publicId}`}
                                                className="font-medium text-slate-900 hover:text-indigo-600"
                                            >
                                                {row.firstName} {row.lastName}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {row.email}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {row.ticketType}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {row.registrationSource}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    row.registrationStatus ===
                                                    "REGISTERED"
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {row.registrationStatus ===
                                                "REGISTERED"
                                                    ? "Registered"
                                                    : "Cancelled"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                                            {new Date(
                                                row.createdAt
                                            ).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() =>
                                                    deleteOne(
                                                        row.publicId,
                                                        `${row.firstName} ${row.lastName}`
                                                    )
                                                }
                                                className="rounded p-1.5 text-red-500 hover:bg-red-50"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
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
