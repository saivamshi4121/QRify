"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Archive, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
    EventStatusBadge,
    formatEventDateRange,
} from "@/components/events/EventStatusBadge";
import { EVENT_STATUS_VALUES, EventStatusValue } from "@/modules/event/constants";

type EventRow = {
    _id: string;
    name: string;
    slug: string;
    logo?: string;
    venue?: string;
    timezone: string;
    startDate: string;
    endDate: string;
    status: EventStatusValue;
};

export default function EventsListPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [events, setEvents] = useState<EventRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [sort, setSort] = useState("startDate_desc");
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        if (authStatus === "unauthenticated") router.replace("/login");
    }, [authStatus, router]);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q.trim()) params.set("q", q.trim());
            if (statusFilter) params.set("status", statusFilter);
            if (sort) params.set("sort", sort);
            const res = await fetch(`/api/v2/events?${params.toString()}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to load");
            setEvents(json.data || []);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, [q, statusFilter, sort]);

    useEffect(() => {
        if (session) fetchEvents();
    }, [session, fetchEvents]);

    async function handleArchive(event: EventRow) {
        if (!confirm(`Archive "${event.name}"?`)) return;
        setBusyId(event._id);
        try {
            const res = await fetch(`/api/v2/events/${event._id}/archive`, {
                method: "POST",
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Archive failed");
            toast.success("Event archived");
            fetchEvents();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Archive failed");
        } finally {
            setBusyId(null);
        }
    }

    async function handleDelete(event: EventRow) {
        if (
            !confirm(
                `Delete "${event.name}"? This cannot be undone.`
            )
        ) {
            return;
        }
        setBusyId(event._id);
        try {
            const res = await fetch(`/api/v2/events/${event._id}`, {
                method: "DELETE",
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Delete failed");
            toast.success("Event deleted");
            fetchEvents();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Delete failed");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="space-y-6">
            <Toaster richColors position="top-right" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Events</h1>
                    <p className="mt-2 text-slate-500">
                        Organize events for QR ticketing and check-in.
                    </p>
                </div>
                <Link
                    href="/events/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4" />
                    Create Event
                </Link>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                <input
                    type="search"
                    placeholder="Search events…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 sm:max-w-xs"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                    <option value="">All statuses</option>
                    {EVENT_STATUS_VALUES.map((s) => (
                        <option key={s} value={s}>
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                        </option>
                    ))}
                </select>
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                    <option value="startDate_desc">Date (newest first)</option>
                    <option value="startDate_asc">Date (oldest first)</option>
                    <option value="createdAt_desc">Recently created</option>
                </select>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : events.length === 0 ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                    <h2 className="text-xl font-bold text-slate-900">
                        No events yet
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-slate-500">
                        Create your first event to start building QR ticketing
                        and check-in later.
                    </p>
                    <Link
                        href="/events/new"
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Create Event
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {events.map((event) => (
                        <article
                            key={event._id}
                            className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                        >
                            <div className="flex h-28 items-center justify-center bg-slate-100">
                                {event.logo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={event.logo}
                                        alt=""
                                        className="h-16 w-16 rounded-lg object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-slate-300">
                                        {event.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col p-5">
                                <div className="flex items-start justify-between gap-2">
                                    <Link
                                        href={`/events/${event._id}`}
                                        className="min-w-0 text-base font-semibold text-slate-900 hover:text-indigo-600"
                                    >
                                        <span className="line-clamp-2">
                                            {event.name}
                                        </span>
                                    </Link>
                                    <EventStatusBadge status={event.status} />
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    {formatEventDateRange(
                                        event.startDate,
                                        event.endDate,
                                        event.timezone
                                    )}
                                </p>
                                <p className="mt-1 truncate text-sm text-slate-600">
                                    {event.venue || "Venue not set"}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-1 border-t border-slate-100 pt-3">
                                    <Link
                                        href={`/events/${event._id}/edit`}
                                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                                        title="Edit"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                    {event.status !== "ARCHIVED" ? (
                                        <button
                                            type="button"
                                            title="Archive"
                                            disabled={busyId === event._id}
                                            onClick={() => handleArchive(event)}
                                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                                        >
                                            <Archive className="h-4 w-4" />
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        title="Delete"
                                        disabled={busyId === event._id}
                                        onClick={() => handleDelete(event)}
                                        className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-40"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
