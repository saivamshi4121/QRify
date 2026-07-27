"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Archive,
    CalendarDays,
    MapPin,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import {
    EventStatusBadge,
    formatEventDateRange,
} from "@/components/events/EventStatusBadge";
import { EVENT_STATUS_VALUES, EventStatusValue } from "@/modules/event/constants";
import { SkeletonCards } from "@/app/(dashboard)/_components/Skeletons";
import { EmptyState } from "@/app/(dashboard)/_components/EmptyState";

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

function EventCard({
    event,
    busyId,
    onArchive,
    onDelete,
}: {
    event: EventRow;
    busyId: string | null;
    onArchive: (e: EventRow) => void;
    onDelete: (e: EventRow) => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const isBusy = busyId === event._id;

    return (
        <article className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-150 hover:shadow-md">
            {/* Thumbnail / Header */}
            <Link
                href={`/events/${event._id}`}
                className="flex h-32 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50"
            >
                {event.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={event.logo}
                        alt=""
                        className="h-16 w-16 rounded-xl object-cover shadow-sm"
                    />
                ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-2xl font-bold text-slate-300 shadow-sm ring-1 ring-slate-100">
                        {event.name.charAt(0).toUpperCase()}
                    </div>
                )}
            </Link>

            {/* Content */}
            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                    <Link
                        href={`/events/${event._id}`}
                        className="min-w-0 text-sm font-semibold leading-snug text-slate-900 line-clamp-2 hover:text-indigo-600 transition-colors"
                    >
                        {event.name}
                    </Link>
                    <EventStatusBadge status={event.status} />
                </div>

                <div className="mt-2.5 space-y-1">
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {formatEventDateRange(event.startDate, event.endDate, event.timezone)}
                    </p>
                    {event.venue && (
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{event.venue}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
                <Link
                    href={`/events/${event._id}/attendees`}
                    className="text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    Attendees
                </Link>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        aria-label="More actions"
                        disabled={isBusy}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menuOpen && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuOpen(false)}
                            />
                            <div className="absolute bottom-full right-0 z-20 mb-1 min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 shadow-md">
                                <Link
                                    href={`/events/${event._id}/edit`}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                                    Edit event
                                </Link>
                                {event.status !== "ARCHIVED" && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            onArchive(event);
                                        }}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        <Archive className="h-3.5 w-3.5 text-slate-400" />
                                        Archive
                                    </button>
                                )}
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onDelete(event);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete event
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}

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
        if (!confirm(`Delete "${event.name}"? This cannot be undone.`)) return;
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

            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Events
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage events for QR ticketing and check-in.
                    </p>
                </div>
                <Link
                    href="/events/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4" />
                    Create Event
                </Link>
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        placeholder="Search events…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
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
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
                >
                    <option value="startDate_desc">Date (newest first)</option>
                    <option value="startDate_asc">Date (oldest first)</option>
                    <option value="createdAt_desc">Recently created</option>
                </select>
            </div>

            {/* Content */}
            {loading ? (
                <SkeletonCards count={6} />
            ) : events.length === 0 ? (
                <EmptyState
                    icon={<CalendarDays className="h-7 w-7" />}
                    title="No events found"
                    description={
                        q || statusFilter
                            ? "Try adjusting your search or filters."
                            : "Create your first event to start building QR ticketing and check-in."
                    }
                    action={
                        !q && !statusFilter ? (
                            <Link
                                href="/events/new"
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                <Plus className="h-4 w-4" />
                                Create Event
                            </Link>
                        ) : undefined
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {events.map((event) => (
                        <EventCard
                            key={event._id}
                            event={event}
                            busyId={busyId}
                            onArchive={handleArchive}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
