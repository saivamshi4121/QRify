"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Activity, QrCode, CheckCircle, XCircle, TrendingUp, Loader2 } from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/app/(dashboard)/_components/StatCard";
import { SectionCard } from "@/app/(dashboard)/_components/SectionCard";
import { Toaster, toast } from "sonner";

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

export default function DashboardPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!session?.user?.id) return;
            try {
                // Use real session usage
                const res = await fetch(`/api/dashboard/overview?userId=${session.user.id}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch dashboard data");
                }
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                } else {
                    toast.error(json.message || "Failed to load");
                }
            } catch (error) {
                console.error("Dashboard fetch error:", error);
                toast.error("Could not load dashboard data");
            } finally {
                setLoading(false);
            }
        }

        if (session?.user?.id) {
            fetchData();
        }
    }, [session?.user?.id]);

    if (loading) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!data) return <div className="p-8 text-center text-slate-500">Failed to load data.</div>;

    return (
        <div className="space-y-8">
            <Toaster richColors position="top-right" />
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
                <p className="mt-2 text-slate-500">Welcome back! Here's what's happening with your QR codes.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total QR Codes"
                    value={data.totalQRCodes}
                    icon={<QrCode className="h-6 w-6 text-indigo-600" />}
                />
                <StatCard
                    title="Total Scans"
                    value={data.totalScans}
                    icon={<Activity className="h-6 w-6 text-emerald-600" />}
                    className="bg-gradient-to-br from-white to-indigo-50/50"
                />
                <StatCard
                    title="Active QRs"
                    value={data.activeQRCodes}
                    icon={<CheckCircle className="h-6 w-6 text-emerald-500" />}
                />
                <StatCard
                    title="Inactive QRs"
                    value={data.inactiveQRCodes}
                    icon={<XCircle className="h-6 w-6 text-slate-500" />}
                />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Recent Scans List */}
                <div className="lg:col-span-2">
                    <SectionCard title="Recent Activity" description="Latest scans across your links">
                        <div className="space-y-4">
                            {data.recentScans.length === 0 ? (
                                <div className="py-8 text-center text-sm text-slate-500 bg-slate-50 rounded-lg">No recent scans found.</div>
                            ) : (
                                data.recentScans.map((scan, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm">
                                            <TrendingUp className="h-5 w-5 text-indigo-500" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-900 truncate">{scan.qrName}</p>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><span className="text-indigo-400">●</span> {scan.country || "Unknown"}</span>
                                                <span>•</span>
                                                <span className="capitalize">{scan.deviceType || "Unknown Device"}</span>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-400 whitespace-nowrap">
                                            {new Date(scan.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </div>
    );
}
