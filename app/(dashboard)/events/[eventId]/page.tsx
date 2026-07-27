"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Archive, ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
    EventStatusBadge,
    formatEventDateRange,
} from "@/components/events/EventStatusBadge";
import { EventStatusValue } from "@/modules/event/constants";

type EventDetail = {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    banner?: string;
    venue?: string;
    timezone: string;
    startDate: string;
    endDate: string;
    status: EventStatusValue;
};

export default function EventDetailPage() {
    const params = useParams();
    const eventId = String(params.eventId);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v2/events/${eventId}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Not found");
            setEvent(json.data);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load");
            router.push("/events");
        } finally {
            setLoading(false);
        }
    }, [eventId, router]);

    useEffect(() => {
        if (session) load();
    }, [session, load]);

    async function handleArchive() {
        if (!event || !confirm(`Archive "${event.name}"?`)) return;
        setBusy(true);
        try {
            const res = await fetch(`/api/v2/events/${eventId}/archive`, {
                method: "POST",
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Archive failed");
            toast.success("Archived");
            setEvent(json.data);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Archive failed");
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete() {
        if (
            !event ||
            !confirm(`Delete "${event.name}"? This cannot be undone.`)
        ) {
            return;
        }
        setBusy(true);
        try {
            const res = await fetch(`/api/v2/events/${eventId}`, {
                method: "DELETE",
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Delete failed");
            toast.success("Deleted");
            router.push("/events");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Delete failed");
            setBusy(false);
        }
    }

    if (loading || !event) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <Toaster richColors position="top-right" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <Link
                        href="/events"
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900">
                                {event.name}
                            </h1>
                            <EventStatusBadge status={event.status} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            {formatEventDateRange(
                                event.startDate,
                                event.endDate,
                                event.timezone
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/events/${event._id}/analytics`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                        Analytics
                    </Link>
                    <Link
                        href={`/events/${event._id}/attendees`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        Attendees
                    </Link>
                    <Link
                        href={`/events/${event._id}/scanners`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        Scanner devices
                    </Link>
                    <Link
                        href={`/events/${event._id}/access`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        Access log
                    </Link>
                    <Link
                        href={`/events/${event._id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit
                    </Link>
                    {event.status !== "ARCHIVED" ? (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={handleArchive}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <Archive className="h-4 w-4" />
                            Archive
                        </button>
                    ) : null}
                    <button
                        type="button"
                        disabled={busy}
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </button>
                </div>
            </div>

            {event.banner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={event.banner}
                    alt=""
                    className="h-48 w-full rounded-xl object-cover"
                />
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    {event.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={event.logo}
                            alt=""
                            className="h-16 w-16 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xl font-bold text-slate-400">
                            {event.name.charAt(0)}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-500">
                            Venue
                        </p>
                        <p className="text-slate-900">
                            {event.venue || "Not set"}
                        </p>
                        <p className="mt-4 text-sm font-medium text-slate-500">
                            Description
                        </p>
                        <p className="whitespace-pre-wrap text-slate-700">
                            {event.description || "No description"}
                        </p>
                    </div>
                </div>
            </div>

            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Use Analytics for live attendance, scanner health, and exports.
                Manage attendees, scanners, and the access log from the links
                above.
            </p>
        </div>
    );
}
