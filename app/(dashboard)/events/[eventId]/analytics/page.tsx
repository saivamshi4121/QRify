"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ArrowLeft,
    Download,
    Loader2,
    RefreshCw,
    Search,
    Users,
    BadgeCheck,
    UserCheck,
    UserX,
    Percent,
    ScanLine,
    ShieldOff,
    Ticket,
} from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { toast, Toaster } from "sonner";
import { StatCard } from "@/app/(dashboard)/_components/StatCard";
import { SectionCard } from "@/app/(dashboard)/_components/SectionCard";
import { cn } from "@/lib/utils";

type Overview = {
    event: { id: string; name: string; status: string };
    kpis: {
        totalAttendees: number;
        registeredAttendees: number;
        credentialsIssued: number;
        credentialsRevoked: number;
        checkedIn: number;
        notCheckedIn: number;
        attendancePercent: number;
        activeScannerDevices: number;
    };
};

type Attendance = {
    registered: number;
    checkedIn: number;
    attendancePercent: number;
    hourly: { hour: string; label: string; count: number }[];
    peakEntryTime: string | null;
    averageEntryRatePerHour: number;
};

type ScannerRow = {
    id: string;
    name: string;
    gate: string;
    status: string;
    lastSeen: string | null;
    lastScanAt: string | null;
    totalScans: number;
    operator: { name: string | null; email: string | null } | null;
    highlight: string;
};

type GateRow = {
    gate: string;
    entries: number;
    deniedAttempts: number;
    averageIntervalSeconds: number | null;
    lastScanAt: string | null;
};

type CredentialMetrics = {
    generated: number;
    revoked: number;
    restored: number;
    downloads: number;
    pngDownloads: number;
    svgDownloads: number;
};

type AccessMetrics = {
    successfulEntries: number;
    deniedAttempts: number;
    alreadyEntered: number;
    invalidCredentials: number;
    revokedCredentials: number;
    expiredCredentials: number;
    cancelledRegistrations: number;
};

type ActivityItem = {
    id: string;
    type: string;
    title: string;
    detail: string;
    occurredAt: string;
};

type SearchHit = {
    kind: string;
    id: string;
    title: string;
    subtitle: string;
    href: string;
};

function formatWhen(iso: string | null) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-lg bg-slate-200/70",
                className
            )}
        />
    );
}

export default function EventAnalyticsPage() {
    const params = useParams();
    const eventId = String(params.eventId);
    const { data: session, status } = useSession();
    const router = useRouter();

    const [overview, setOverview] = useState<Overview | null>(null);
    const [attendance, setAttendance] = useState<Attendance | null>(null);
    const [scanners, setScanners] = useState<ScannerRow[] | null>(null);
    const [gates, setGates] = useState<GateRow[] | null>(null);
    const [credentials, setCredentials] = useState<CredentialMetrics | null>(
        null
    );
    const [access, setAccess] = useState<AccessMetrics | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [activityPage, setActivityPage] = useState(1);
    const [activityTotalPages, setActivityTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchQ, setSearchQ] = useState("");
    const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    const loadCore = useCallback(async () => {
        setLoading(true);
        try {
            const [
                ov,
                att,
                sc,
                gt,
                cr,
                ac,
                act,
            ] = await Promise.all([
                fetch(
                    `/api/v2/events/${eventId}/analytics?section=overview`
                ).then((r) => r.json()),
                fetch(
                    `/api/v2/events/${eventId}/analytics?section=attendance`
                ).then((r) => r.json()),
                fetch(
                    `/api/v2/events/${eventId}/analytics?section=scanners`
                ).then((r) => r.json()),
                fetch(
                    `/api/v2/events/${eventId}/analytics?section=gates`
                ).then((r) => r.json()),
                fetch(
                    `/api/v2/events/${eventId}/analytics?section=credentials`
                ).then((r) => r.json()),
                fetch(
                    `/api/v2/events/${eventId}/analytics?section=access`
                ).then((r) => r.json()),
                fetch(
                    `/api/v2/events/${eventId}/analytics?section=activity&page=1`
                ).then((r) => r.json()),
            ]);

            if (!ov.success) throw new Error(ov.message || "Failed to load");
            setOverview(ov.data);
            setAttendance(att.success ? att.data : null);
            setScanners(sc.success ? sc.data : []);
            setGates(gt.success ? gt.data : []);
            setCredentials(cr.success ? cr.data : null);
            setAccess(ac.success ? ac.data : null);
            if (act.success) {
                setActivity(act.data.items || []);
                setActivityPage(act.data.pagination?.page || 1);
                setActivityTotalPages(act.data.pagination?.totalPages || 1);
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load");
            router.push(`/events/${eventId}`);
        } finally {
            setLoading(false);
        }
    }, [eventId, router]);

    useEffect(() => {
        if (session) void loadCore();
    }, [session, loadCore]);

    async function loadActivity(page: number) {
        try {
            const res = await fetch(
                `/api/v2/events/${eventId}/analytics?section=activity&page=${page}`
            );
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            setActivity(json.data.items || []);
            setActivityPage(json.data.pagination.page);
            setActivityTotalPages(json.data.pagination.totalPages);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load activity");
        }
    }

    async function runSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!searchQ.trim()) {
            setSearchHits([]);
            return;
        }
        setSearching(true);
        try {
            const res = await fetch(
                `/api/v2/events/${eventId}/analytics?section=search&q=${encodeURIComponent(searchQ.trim())}`
            );
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            setSearchHits(json.data.items || []);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Search failed");
        } finally {
            setSearching(false);
        }
    }

    function downloadCsv(exportType: "attendees" | "access" | "credentials") {
        window.open(
            `/api/v2/events/${eventId}/analytics?format=csv&export=${exportType}`,
            "_blank"
        );
    }

    if (loading || !overview) {
        return (
            <div className="mx-auto max-w-6xl space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
                <Skeleton className="h-72" />
            </div>
        );
    }

    const k = overview.kpis;
    const progress =
        attendance && attendance.registered > 0
            ? Math.min(
                  100,
                  (attendance.checkedIn / attendance.registered) * 100
              )
            : 0;

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <Toaster richColors position="top-right" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <Link
                        href={`/events/${eventId}`}
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Event analytics
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {overview.event.name} · {overview.event.status}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => loadCore()}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                    <button
                        type="button"
                        onClick={() => downloadCsv("attendees")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <Download className="h-4 w-4" />
                        Attendees CSV
                    </button>
                    <button
                        type="button"
                        onClick={() => downloadCsv("access")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <Download className="h-4 w-4" />
                        Access CSV
                    </button>
                    <button
                        type="button"
                        onClick={() => downloadCsv("credentials")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <Download className="h-4 w-4" />
                        Credentials CSV
                    </button>
                </div>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total attendees"
                    value={k.totalAttendees}
                    icon={<Users className="h-5 w-5" />}
                />
                <StatCard
                    title="Registered"
                    value={k.registeredAttendees}
                    icon={<BadgeCheck className="h-5 w-5" />}
                />
                <StatCard
                    title="Credentials issued"
                    value={k.credentialsIssued}
                    icon={<Ticket className="h-5 w-5" />}
                />
                <StatCard
                    title="Credentials revoked"
                    value={k.credentialsRevoked}
                    icon={<ShieldOff className="h-5 w-5" />}
                />
                <StatCard
                    title="Checked in"
                    value={k.checkedIn}
                    icon={<UserCheck className="h-5 w-5" />}
                />
                <StatCard
                    title="Not checked in"
                    value={k.notCheckedIn}
                    icon={<UserX className="h-5 w-5" />}
                />
                <StatCard
                    title="Attendance %"
                    value={`${k.attendancePercent}%`}
                    icon={<Percent className="h-5 w-5" />}
                />
                <StatCard
                    title="Active scanners"
                    value={k.activeScannerDevices}
                    icon={<ScanLine className="h-5 w-5" />}
                />
            </section>

            <SectionCard title="Search">
                <form onSubmit={runSearch} className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={searchQ}
                            onChange={(e) => setSearchQ(e.target.value)}
                            placeholder="Search attendees, credentials, access events…"
                            className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={searching}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {searching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        Search
                    </button>
                </form>
                {searchHits.length > 0 ? (
                    <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100">
                        {searchHits.map((hit) => (
                            <li key={`${hit.kind}-${hit.id}`}>
                                <Link
                                    href={hit.href}
                                    className="block px-4 py-3 hover:bg-slate-50"
                                >
                                    <p className="text-sm font-medium text-slate-900">
                                        <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs uppercase text-slate-500">
                                            {hit.kind}
                                        </span>
                                        {hit.title}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {hit.subtitle}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : searchQ && !searching ? (
                    <p className="mt-3 text-sm text-slate-500">No matches</p>
                ) : null}
            </SectionCard>

            <SectionCard title="Attendance">
                {attendance ? (
                    <div className="space-y-6">
                        <div>
                            <div className="mb-2 flex justify-between text-sm text-slate-600">
                                <span>
                                    {attendance.checkedIn} /{" "}
                                    {attendance.registered} checked in
                                </span>
                                <span>{attendance.attendancePercent}%</span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Peak entry time
                                </p>
                                <p className="mt-1 text-lg font-semibold text-slate-900">
                                    {attendance.peakEntryTime || "—"}
                                </p>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Avg entry rate
                                </p>
                                <p className="mt-1 text-lg font-semibold text-slate-900">
                                    {attendance.averageEntryRatePerHour} / hour
                                </p>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            {attendance.hourly.length === 0 ? (
                                <p className="flex h-full items-center justify-center text-sm text-slate-500">
                                    No check-ins yet
                                </p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={attendance.hourly}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                        />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 11 }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#4f46e5"
                                            fill="#c7d2fe"
                                            name="Check-ins"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">No attendance data</p>
                )}
            </SectionCard>

            <SectionCard title="Scanner monitoring">
                {!scanners || scanners.length === 0 ? (
                    <p className="text-sm text-slate-500">
                        No paired scanners yet. Pair devices from Scanner
                        devices.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Device</th>
                                    <th className="px-3 py-2 font-medium">Gate</th>
                                    <th className="px-3 py-2 font-medium">Status</th>
                                    <th className="px-3 py-2 font-medium">Last seen</th>
                                    <th className="px-3 py-2 font-medium">Last scan</th>
                                    <th className="px-3 py-2 font-medium">Scans</th>
                                    <th className="px-3 py-2 font-medium">Operator</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {scanners.map((s) => (
                                    <tr
                                        key={s.id}
                                        className={cn(
                                            s.highlight === "offline" &&
                                                "bg-amber-50/80",
                                            s.highlight === "inactive" &&
                                                "bg-slate-50",
                                            s.highlight === "disabled" &&
                                                "bg-red-50/60"
                                        )}
                                    >
                                        <td className="px-3 py-2.5 font-medium text-slate-900">
                                            {s.name}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600">
                                            {s.gate}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium ring-1 ring-slate-200">
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600">
                                            {formatWhen(s.lastSeen)}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600">
                                            {formatWhen(s.lastScanAt)}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-900">
                                            {s.totalScans}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600">
                                            {s.operator?.name ||
                                                s.operator?.email ||
                                                "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Gate performance">
                {!gates || gates.length === 0 ? (
                    <p className="text-sm text-slate-500">No gate activity yet</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Gate</th>
                                    <th className="px-3 py-2 font-medium">Entries</th>
                                    <th className="px-3 py-2 font-medium">
                                        Denied
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Avg. interval
                                    </th>
                                    <th className="px-3 py-2 font-medium">
                                        Last scan
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {gates.map((g) => (
                                    <tr key={g.gate}>
                                        <td className="px-3 py-2.5 font-medium">
                                            {g.gate}
                                        </td>
                                        <td className="px-3 py-2.5">{g.entries}</td>
                                        <td className="px-3 py-2.5">
                                            {g.deniedAttempts}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600">
                                            {g.averageIntervalSeconds != null
                                                ? `${g.averageIntervalSeconds}s`
                                                : "—"}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600">
                                            {formatWhen(g.lastScanAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="mt-2 text-xs text-slate-400">
                            Avg. interval is the average time between successful
                            entries at that gate (throughput proxy).
                        </p>
                    </div>
                )}
            </SectionCard>

            <div className="grid gap-6 lg:grid-cols-2">
                <SectionCard title="Credential metrics">
                    {credentials ? (
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                            {[
                                ["Generated", credentials.generated],
                                ["Revoked", credentials.revoked],
                                ["Restored", credentials.restored],
                                ["Downloaded", credentials.downloads],
                                ["PNG downloads", credentials.pngDownloads],
                                ["SVG downloads", credentials.svgDownloads],
                            ].map(([label, value]) => (
                                <div
                                    key={String(label)}
                                    className="rounded-lg border border-slate-100 px-3 py-2"
                                >
                                    <dt className="text-xs text-slate-500">
                                        {label}
                                    </dt>
                                    <dd className="mt-0.5 text-lg font-semibold text-slate-900">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    ) : (
                        <p className="text-sm text-slate-500">No credential data</p>
                    )}
                </SectionCard>

                <SectionCard title="Access metrics">
                    {access ? (
                        <dl className="grid grid-cols-2 gap-3 text-sm">
                            {[
                                ["Successful entries", access.successfulEntries],
                                ["Denied attempts", access.deniedAttempts],
                                ["Already entered", access.alreadyEntered],
                                [
                                    "Invalid credentials",
                                    access.invalidCredentials,
                                ],
                                [
                                    "Revoked credentials",
                                    access.revokedCredentials,
                                ],
                                [
                                    "Expired credentials",
                                    access.expiredCredentials,
                                ],
                                [
                                    "Cancelled registrations",
                                    access.cancelledRegistrations,
                                ],
                            ].map(([label, value]) => (
                                <div
                                    key={String(label)}
                                    className="rounded-lg border border-slate-100 px-3 py-2"
                                >
                                    <dt className="text-xs text-slate-500">
                                        {label}
                                    </dt>
                                    <dd className="mt-0.5 text-lg font-semibold text-slate-900">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    ) : (
                        <p className="text-sm text-slate-500">No access data</p>
                    )}
                </SectionCard>
            </div>

            <SectionCard title="Recent activity">
                {activity.length === 0 ? (
                    <p className="text-sm text-slate-500">No activity yet</p>
                ) : (
                    <>
                        <ol className="space-y-3">
                            {activity.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex gap-3 border-b border-slate-50 pb-3 last:border-0"
                                >
                                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-900">
                                            {item.title}
                                        </p>
                                        <p className="truncate text-xs text-slate-500">
                                            {item.detail}
                                        </p>
                                    </div>
                                    <time className="shrink-0 text-xs text-slate-400">
                                        {formatWhen(item.occurredAt)}
                                    </time>
                                </li>
                            ))}
                        </ol>
                        <div className="mt-4 flex items-center justify-between">
                            <button
                                type="button"
                                disabled={activityPage <= 1}
                                onClick={() => loadActivity(activityPage - 1)}
                                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-slate-500">
                                Page {activityPage} of {activityTotalPages}
                            </span>
                            <button
                                type="button"
                                disabled={activityPage >= activityTotalPages}
                                onClick={() => loadActivity(activityPage + 1)}
                                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </SectionCard>
        </div>
    );
}
