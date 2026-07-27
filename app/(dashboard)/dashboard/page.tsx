"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Activity,
    QrCode,
    CheckCircle,
    XCircle,
    TrendingUp,
    ArrowRight,
    CalendarDays,
    Plus,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { SkeletonStatGrid } from "@/app/(dashboard)/_components/Skeletons";
import { Skeleton } from "@/app/(dashboard)/_components/Skeletons";
import { EmptyState } from "@/app/(dashboard)/_components/EmptyState";

interface DashboardData {
    totalQRCodes: number;
    totalScans: number;
    activeQRCodes: number;
    inactiveQRCodes: number;
    recentScans: Array<{
        qrCodeId: string;
        qrName: string;
        scannedAt: string;
        country: string;
        deviceType: string;
    }>;
}

function StatCard({
    title,
    value,
    icon,
    iconBg,
    trend,
}: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    iconBg: string;
    trend?: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="mt-2.5 text-3xl font-semibold tabular-nums text-slate-900">
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </p>
                    {trend && (
                        <p className="mt-1.5 text-xs text-slate-400">{trend}</p>
                    )}
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function formatScanTime(iso: string) {
    try {
        return new Date(iso).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

export default function DashboardPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
        }
    }, [status, router]);

    useEffect(() => {
        async function fetchData() {
            if (!session?.user?.id || status !== "authenticated") return;
            try {
                const res = await fetch("/api/dashboard/overview");
                if (!res.ok) throw new Error("Failed to fetch dashboard data");
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                } else {
                    toast.error(json.message || "Failed to load");
                }
            } catch {
                toast.error("Could not load dashboard data");
            } finally {
                setLoading(false);
            }
        }

        if (session?.user?.id && status === "authenticated") {
            fetchData();
        }
    }, [session?.user?.id, status]);

    const userName = session?.user?.name?.split(" ")[0] || "there";

    return (
        <div className="space-y-8">
            <Toaster richColors position="top-right" />

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Good to see you, {userName} 👋
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Here&apos;s an overview of your QR platform.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/events/new"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <CalendarDays className="h-4 w-4" />
                        New Event
                    </Link>
                    <Link
                        href="/create"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Generate QR
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            {loading ? (
                <SkeletonStatGrid count={4} />
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total QR Codes"
                        value={data?.totalQRCodes ?? 0}
                        icon={<QrCode className="h-5 w-5 text-indigo-600" />}
                        iconBg="bg-indigo-50"
                    />
                    <StatCard
                        title="Total Scans"
                        value={data?.totalScans ?? 0}
                        icon={<Activity className="h-5 w-5 text-emerald-600" />}
                        iconBg="bg-emerald-50"
                    />
                    <StatCard
                        title="Active QR Codes"
                        value={data?.activeQRCodes ?? 0}
                        icon={<CheckCircle className="h-5 w-5 text-sky-600" />}
                        iconBg="bg-sky-50"
                    />
                    <StatCard
                        title="Inactive QR Codes"
                        value={data?.inactiveQRCodes ?? 0}
                        icon={<XCircle className="h-5 w-5 text-slate-500" />}
                        iconBg="bg-slate-100"
                    />
                </div>
            )}

            {/* Recent Activity */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            Recent Activity
                        </h2>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Latest scans across your QR codes
                        </p>
                    </div>
                    <Link
                        href="/analytics"
                        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                        View analytics
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                <div className="divide-y divide-slate-50">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-3.5">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div className="flex flex-1 flex-col gap-1.5">
                                    <Skeleton className="h-3.5 w-48" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-3 w-20" />
                            </div>
                        ))
                    ) : !data || data.recentScans.length === 0 ? (
                        <EmptyState
                            icon={<Activity className="h-6 w-6" />}
                            title="No scan activity yet"
                            description="Once people scan your QR codes, activity will appear here."
                            action={
                                <Link
                                    href="/create"
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create your first QR
                                </Link>
                            }
                            className="border-0 rounded-none"
                        />
                    ) : (
                        data.recentScans.map((scan, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/60 transition-colors"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-900">
                                        {scan.qrName}
                                    </p>
                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                                        <span>{scan.country || "Unknown location"}</span>
                                        <span className="text-slate-300">·</span>
                                        <span className="capitalize">
                                            {scan.deviceType || "Unknown device"}
                                        </span>
                                    </div>
                                </div>
                                <span className="shrink-0 text-xs text-slate-400 tabular-nums">
                                    {formatScanTime(scan.scannedAt)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
