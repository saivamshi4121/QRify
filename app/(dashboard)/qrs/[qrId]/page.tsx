"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, TrendingUp, Smartphone, Globe } from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { StatCard } from "@/app/(dashboard)/_components/StatCard";
import { SectionCard } from "@/app/(dashboard)/_components/SectionCard";
import { Toaster, toast } from "sonner";

// Colors for Pie Chart
const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

interface StatsData {
    totalScans: number;
    uniqueScans: number;
    scansByDate: { date: string; count: number }[];
    deviceBreakdown: Record<string, number>;
    countryBreakdown: { country: string; count: number }[];
}

export default function QRAnalyticsPage() {
    const params = useParams(); // { qrId }
    const [data, setData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch(`/api/qr/stats/${params.qrId}`);
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                } else {
                    toast.error("Failed to load analytics");
                }
            } catch (error) {
                console.error(error);
                toast.error("Error loading data");
            } finally {
                setLoading(false);
            }
        }
        if (params.qrId) {
            fetchStats();
        }
    }, [params.qrId]);

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;

    if (!data) return <div className="p-8">No data found.</div>;

    // Transform Device Data for Recharts
    const deviceData = Object.entries(data.deviceBreakdown).map(([name, value]) => ({ name, value }));

    return (
        <div className="space-y-8">
            <Toaster richColors position="top-right" />
            <div>
                <h1 className="text-3xl font-bold text-slate-900">QR Analytics</h1>
                <p className="mt-2 text-slate-500">Real-time performance metrics</p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <StatCard
                    title="Total Scans"
                    value={data.totalScans}
                    icon={<TrendingUp className="h-6 w-6 text-indigo-600" />}
                />
                <StatCard
                    title="Unique Scans"
                    value={data.uniqueScans}
                    icon={<Globe className="h-6 w-6 text-emerald-600" />}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Line Chart */}
                <div className="lg:col-span-2">
                    <SectionCard title="Scan Trend" description="Scans over time">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.scansByDate}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#colorCount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </SectionCard>
                </div>

                {/* Pie Chart */}
                <div className="lg:col-span-1">
                    <SectionCard title="Devices" description="Scan sources breakdown">
                        <div className="h-[300px] w-full flex items-center justify-center">
                            {deviceData.length === 0 ? (
                                <p className="text-slate-400 text-sm">No data yet</p>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={deviceData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {deviceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                        {/* Legend */}
                        <div className="flex flex-wrap gap-3 justify-center text-xs mt-4">
                            {deviceData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-slate-600 capitalize">{entry.name} ({entry.value})</span>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>
            </div>

            {/* Country Table */}
            <SectionCard title="Top Locations" description="Where your scans are coming from">
                <div className="overflow-hidden">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-slate-50 font-medium text-slate-500">
                            <tr>
                                <th className="px-6 py-3">Country</th>
                                <th className="px-6 py-3">Scans</th>
                                <th className="px-6 py-3 w-full">Usage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.countryBreakdown.length === 0 && (
                                <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-400">No location data yet.</td></tr>
                            )}
                            {data.countryBreakdown.map((item, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-3 font-medium text-slate-900">{item.country || "Unknown"}</td>
                                    <td className="px-6 py-3 text-slate-600">{item.count}</td>
                                    <td className="px-6 py-3">
                                        <div className="h-1.5 w-full max-w-[100px] bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500"
                                                style={{ width: `${Math.min((item.count / data.totalScans) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SectionCard>
        </div>
    );
}
