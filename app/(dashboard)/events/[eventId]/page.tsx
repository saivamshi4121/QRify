"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Archive,
    ArrowLeft,
    CalendarDays,
    MapPin,
    Pencil,
    Trash2,
    Users,
    Scan,
    BarChart3,
    ScrollText,
    Info,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import {
    EventStatusBadge,
    formatEventDateRange,
} from "@/components/events/EventStatusBadge";
import { EventStatusValue } from "@/modules/event/constants";
import { Skeleton } from "@/app/(dashboard)/_components/Skeletons";
import { cn } from "@/lib/utils";

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

function EventDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-7 w-64" />
                    <Skeleton className="h-4 w-40" />
                </div>
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
        </div>
    );
}

export default function EventDetailPage() {
    const params = useParams();
    const eventId = String(params.eventId);
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
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
        if (!event || !confirm(`Delete "${event.name}"? This cannot be undone.`)) return;
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

    // Tab definitions
    const tabs = [
        {
            name: "Overview",
            href: `/events/${eventId}`,
            icon: Info,
            exact: true,
        },
        {
            name: "Attendees",
            href: `/events/${eventId}/attendees`,
            icon: Users,
        },
        {
            name: "Scanners",
            href: `/events/${eventId}/scanners`,
            icon: Scan,
        },
        {
            name: "Analytics",
            href: `/events/${eventId}/analytics`,
            icon: BarChart3,
        },
        {
            name: "Access Log",
            href: `/events/${eventId}/access`,
            icon: ScrollText,
        },
    ];

    function isTabActive(tab: (typeof tabs)[0]) {
        if (tab.exact) return pathname === tab.href;
        return pathname.startsWith(tab.href);
    }

    if (loading || !event) {
        return <EventDetailSkeleton />;
    }

    return (
        <div className="space-y-0">
            <Toaster richColors position="top-right" />

            {/* Page header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <Link
                        href="/events"
                        className="mt-0.5 rounded-lg border border-white/[0.08] p-2 text-slate-400 shadow-sm hover:bg-white/[0.05] transition-colors"
                        aria-label="Back to events"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl font-semibold tracking-tight text-white">
                                {event.name}
                            </h1>
                            <EventStatusBadge status={event.status} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                                {formatEventDateRange(
                                    event.startDate,
                                    event.endDate,
                                    event.timezone
                                )}
                            </span>
                            {event.venue && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                                    {event.venue}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/events/${event._id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-sm font-medium text-slate-300 shadow-sm hover:bg-white/[0.08]"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                    </Link>
                    {event.status !== "ARCHIVED" && (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={handleArchive}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-sm font-medium text-slate-300 shadow-sm hover:bg-white/[0.08] disabled:opacity-50"
                        >
                            <Archive className="h-3.5 w-3.5" />
                            Archive
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={busy}
                        onClick={handleDelete}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 shadow-sm hover:bg-red-500/20 disabled:opacity-50"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                    </button>
                </div>
            </div>

            {/* Tab bar */}
            <div className="border-b border-white/[0.08]">
                <nav className="-mb-px flex gap-0 overflow-x-auto" aria-label="Event tabs">
                    {tabs.map((tab) => {
                        const active = isTabActive(tab);
                        const Icon = tab.icon;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                                    active
                                        ? "border-indigo-500 text-indigo-400"
                                        : "border-transparent text-slate-500 hover:border-white/[0.15] hover:text-slate-300"
                                )}
                            >
                                <Icon className="h-4 w-4" aria-hidden />
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Tab content — Overview only (other tabs are separate routes) */}
            <div className="pt-6">
                {event.banner && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={event.banner}
                        alt=""
                        className="mb-6 h-52 w-full rounded-xl object-cover"
                    />
                )}

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-sm">
                    <div className="flex items-start gap-5">
                        {event.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={event.logo}
                                alt=""
                                className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-white/[0.08]"
                            />
                        ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-2xl font-bold text-slate-500">
                                {event.name.charAt(0)}
                            </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                    Venue
                                </p>
                                <p className="mt-1 text-white">
                                    {event.venue || <span className="italic text-slate-500">Not set</span>}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                    Description
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-slate-300 leading-relaxed">
                                    {event.description || (
                                        <span className="italic text-slate-500">No description added yet.</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                    Slug
                                </p>
                                <p className="mt-1 font-mono text-sm text-slate-400">
                                    {event.slug}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick navigation hint */}
                <p className="mt-4 rounded-lg border border-dashed border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                    Use the tabs above to manage <strong>Attendees</strong>, <strong>Scanners</strong>, view <strong>Analytics</strong>, and the <strong>Access Log</strong>.
                </p>
            </div>
        </div>
    );
}
