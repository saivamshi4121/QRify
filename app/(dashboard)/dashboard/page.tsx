"use client";

import { useEffect, useState, useRef } from "react";
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
    Zap,
    Globe,
    Smartphone,
    Monitor,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { SkeletonStatGrid, Skeleton } from "@/app/(dashboard)/_components/Skeletons";
import { EmptyState } from "@/app/(dashboard)/_components/EmptyState";
import { StatCard } from "@/app/(dashboard)/_components/StatCard";

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

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<number | null>(null);

    useEffect(() => {
        const start = performance.now();
        const from = display;

        const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(from + (value - from) * eased));

            if (progress < 1) {
                ref.current = requestAnimationFrame(step);
            }
        };

        ref.current = requestAnimationFrame(step);
        return () => {
            if (ref.current) cancelAnimationFrame(ref.current);
        };
    }, [value, duration]);

    return <>{display.toLocaleString()}</>;
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

function getDeviceIcon(deviceType: string) {
    const type = (deviceType || "").toLowerCase();
    if (type.includes("mobile") || type.includes("android") || type.includes("iphone")) {
        return <Smartphone className="h-3.5 w-3.5" />;
    }
    return <Monitor className="h-3.5 w-3.5" />;
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
            <Toaster richColors position="top-right" theme="dark" />

            {/* Header */}
            <div
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                style={{
                    opacity: 1,
                    animation: "fadeInUp 0.6s ease-out",
                }}
            >
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Welcome back, {userName}
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Here&apos;s what&apos;s happening with your QR platform today.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/events/new"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
                    >
                        <CalendarDays className="h-4 w-4" />
                        New Event
                    </Link>
                    <Link
                        href="/create"
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20"
                        style={{
                            background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                            border: "1px solid rgba(99,102,241,0.3)",
                        }}
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
                        icon={<QrCode className="h-5 w-5" />}
                        iconBg="rgba(99,102,241,0.12)"
                        iconColor="#818cf8"
                    />
                    <StatCard
                        title="Total Scans"
                        value={data?.totalScans ?? 0}
                        icon={<Activity className="h-5 w-5" />}
                        iconBg="rgba(34,211,238,0.12)"
                        iconColor="#22d3ee"
                    />
                    <StatCard
                        title="Active QR Codes"
                        value={data?.activeQRCodes ?? 0}
                        icon={<CheckCircle className="h-5 w-5" />}
                        iconBg="rgba(52,211,153,0.12)"
                        iconColor="#34d399"
                    />
                    <StatCard
                        title="Inactive QR Codes"
                        value={data?.inactiveQRCodes ?? 0}
                        icon={<XCircle className="h-5 w-5" />}
                        iconBg="rgba(148,163,184,0.12)"
                        iconColor="#94a3b8"
                    />
                </div>
            )}

            {/* Quick Actions */}
            <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                style={{ animation: "fadeInUp 0.6s ease-out 0.2s both" }}
            >
                {[
                    {
                        title: "Create QR Code",
                        desc: "Generate a new dynamic QR",
                        href: "/create",
                        icon: <QrCode className="h-5 w-5" />,
                        color: "#818cf8",
                        bg: "rgba(99,102,241,0.1)",
                    },
                    {
                        title: "New Event",
                        desc: "Set up a check-in event",
                        href: "/events/new",
                        icon: <CalendarDays className="h-5 w-5" />,
                        color: "#22d3ee",
                        bg: "rgba(34,211,238,0.1)",
                    },
                    {
                        title: "Review Pages",
                        desc: "Manage your review pages",
                        href: "/smart-pages",
                        icon: <Zap className="h-5 w-5" />,
                        color: "#a78bfa",
                        bg: "rgba(167,139,250,0.1)",
                    },
                ].map((item, i) => (
                    <Link
                        key={i}
                        href={item.href}
                        className="group relative flex items-center gap-4 rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px]"
                        style={{
                            background: "linear-gradient(160deg, rgba(15,20,35,0.9), rgba(10,14,28,0.95))",
                            border: "1px solid rgba(99,102,241,0.08)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = `${item.color}30`;
                            e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${item.bg}`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(99,102,241,0.08)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                            style={{ background: item.bg, color: item.color }}
                        >
                            {item.icon}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">{item.title}</p>
                            <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                        <ArrowRight className="ml-auto h-4 w-4 text-slate-600 transition-all duration-300 group-hover:text-slate-400 group-hover:translate-x-1" />
                    </Link>
                ))}
            </div>

            {/* Recent Activity */}
            <div
                className="rounded-2xl border border-white/[0.06] overflow-hidden"
                style={{
                    background: "linear-gradient(160deg, rgba(15,20,35,0.9) 0%, rgba(10,14,28,0.95) 100%)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                    animation: "fadeInUp 0.6s ease-out 0.3s both",
                }}
            >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-white">
                            Recent Activity
                        </h2>
                        <p className="mt-0.5 text-sm text-slate-400">
                            Latest scans across your QR codes
                        </p>
                    </div>
                    <Link
                        href="/analytics"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                        View analytics
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                <div className="divide-y divide-white/[0.04]">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-6 py-4">
                                <Skeleton className="h-10 w-10 rounded-xl" />
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
                                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                                    style={{
                                        background: "linear-gradient(135deg, #4f46e5, #6366f1)",
                                        border: "1px solid rgba(99,102,241,0.3)",
                                    }}
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
                                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02]"
                            >
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                    style={{
                                        background: "rgba(99,102,241,0.1)",
                                        color: "#818cf8",
                                    }}
                                >
                                    {getDeviceIcon(scan.deviceType)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-white">
                                        {scan.qrName}
                                    </p>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                        <Globe className="h-3 w-3" />
                                        <span>{scan.country || "Unknown"}</span>
                                        <span className="text-slate-600">·</span>
                                        <span className="capitalize">
                                            {scan.deviceType || "Unknown device"}
                                        </span>
                                    </div>
                                </div>
                                <span className="shrink-0 text-xs text-slate-500 tabular-nums font-medium">
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
