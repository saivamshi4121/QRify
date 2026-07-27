"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ArrowLeft,
    Clock,
    DoorOpen,
    Loader2,
    Pencil,
    Plus,
    RefreshCw,
    Scan,
    ShieldOff,
    User,
    Wifi,
    WifiOff,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import QRCode from "qrcode";
import { StatusBadge } from "@/app/(dashboard)/_components/StatusBadge";
import { EmptyState } from "@/app/(dashboard)/_components/EmptyState";
import { Skeleton } from "@/app/(dashboard)/_components/Skeletons";

type Device = {
    id: string;
    publicId: string;
    name: string;
    gate: string;
    status: string;
    pairedAt: string | null;
    lastSeen: string | null;
    lastScanAt: string | null;
    appVersion: string | null;
    operator: { name: string | null; email: string | null } | null;
    pairingExpiresAt?: string | null;
};

type PairingData = {
    device: Device;
    pairingCode: string;
    pairingQr: string;
    expiresAt: string;
};

function formatRelative(iso: string | null) {
    if (!iso) return "—";
    try {
        const diff = Date.now() - new Date(iso).getTime();
        const secs = Math.floor(diff / 1000);
        if (secs < 60) return `${secs}s ago`;
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return new Date(iso).toLocaleDateString();
    } catch {
        return iso;
    }
}

function DeviceStatusIcon({ status }: { status: string }) {
    if (status === "ONLINE")
        return <Wifi className="h-4 w-4 text-emerald-500" />;
    if (status === "PAIRING")
        return <Loader2 className="h-4 w-4 animate-spin text-amber-500" />;
    return <WifiOff className="h-4 w-4 text-slate-400" />;
}

function DeviceCard({
    device,
    onRename,
    onRevoke,
}: {
    device: Device;
    onRename: (d: Device) => void;
    onRevoke: (d: Device) => void;
}) {
    return (
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
                {/* Status indicator */}
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                    <DeviceStatusIcon status={device.status} />
                </div>

                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{device.name}</h3>
                        <StatusBadge status={device.status} />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                        {device.gate && (
                            <span className="flex items-center gap-1">
                                <DoorOpen className="h-3.5 w-3.5 text-slate-400" />
                                Gate: {device.gate}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            Last seen: {formatRelative(device.lastSeen)}
                        </span>
                        {device.operator && (
                            <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-slate-400" />
                                {device.operator.name ||
                                    device.operator.email ||
                                    "Unknown operator"}
                            </span>
                        )}
                        {device.appVersion && (
                            <span className="text-slate-400">v{device.appVersion}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => onRename(device)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                </button>
                {device.status !== "DISABLED" && (
                    <button
                        type="button"
                        onClick={() => onRevoke(device)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <ShieldOff className="h-3.5 w-3.5" />
                        Revoke
                    </button>
                )}
            </div>
        </div>
    );
}

export default function ScannerDevicesPage() {
    const params = useParams();
    const eventId = String(params.eventId);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [pairing, setPairing] = useState<PairingData | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [busy, setBusy] = useState(false);
    const [deviceName, setDeviceName] = useState("Gate Scanner");

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v2/events/${eventId}/scanner-devices`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to load");
            setDevices(json.data || []);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        if (session) load();
    }, [session, load]);

    useEffect(() => {
        if (!pairing?.pairingQr) {
            setQrDataUrl("");
            return;
        }
        QRCode.toDataURL(pairing.pairingQr, { width: 200, margin: 2 }).then(
            setQrDataUrl
        );
    }, [pairing?.pairingQr]);

    const expiresIn = useMemo(() => {
        if (!pairing?.expiresAt) return "";
        const ms = new Date(pairing.expiresAt).getTime() - Date.now();
        if (ms <= 0) return "Expired";
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${m}:${s.toString().padStart(2, "0")}`;
    }, [pairing]);

    async function startPairing() {
        setBusy(true);
        try {
            const res = await fetch(
                `/api/v2/events/${eventId}/scanner-devices/pair`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: deviceName || "Scanner" }),
                }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Pairing failed");
            setPairing(json.data);
            toast.success("Pairing code created");
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Pairing failed");
        } finally {
            setBusy(false);
        }
    }

    async function renameDevice(device: Device) {
        const name = prompt("Device name", device.name);
        if (!name?.trim()) return;
        try {
            const res = await fetch(
                `/api/v2/events/${eventId}/scanner-devices/${device.publicId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: name.trim() }),
                }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Rename failed");
            toast.success("Renamed");
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Rename failed");
        }
    }

    async function revokeDevice(device: Device) {
        if (!confirm(`Revoke "${device.name}"? It will need to be paired again.`)) return;
        try {
            const res = await fetch(
                `/api/v2/events/${eventId}/scanner-devices/${device.publicId}`,
                { method: "DELETE" }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Revoke failed");
            toast.success("Device revoked");
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Revoke failed");
        }
    }

    const onlineCount = devices.filter((d) => d.status === "ONLINE").length;
    const offlineCount = devices.filter(
        (d) => d.status === "OFFLINE" || d.status === "DISABLED"
    ).length;

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Toaster richColors position="top-right" />

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <Link
                        href={`/events/${eventId}`}
                        className="mt-0.5 rounded-lg border border-slate-200 p-2 text-slate-500 shadow-sm hover:bg-slate-50"
                        aria-label="Back to event"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                            Scanner Devices
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Pair gate scanners without sharing staff passwords.
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => load()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {/* Stats strip */}
            {devices.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Total devices", value: devices.length, color: "text-slate-900" },
                        { label: "Online", value: onlineCount, color: "text-emerald-600" },
                        { label: "Offline", value: offlineCount, color: "text-slate-500" },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center shadow-sm"
                        >
                            <p className={`text-2xl font-semibold ${stat.color}`}>
                                {stat.value}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Pair new scanner card */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                        <Plus className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900">
                        Pair new scanner
                    </h2>
                </div>
                <p className="ml-10 text-sm text-slate-500">
                    Generate a 6-digit code (expires in 5 minutes). Volunteers enter it on{" "}
                    <span className="font-mono text-xs text-slate-700">scanner.qrezo.com</span>.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Device name
                        </label>
                        <input
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            placeholder="Gate Scanner"
                        />
                    </div>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={startPairing}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Scan className="h-4 w-4" />
                        )}
                        Generate pairing code
                    </button>
                </div>

                {/* Pairing result */}
                {pairing && (
                    <div className="mt-5 grid gap-5 rounded-xl border border-indigo-100 bg-indigo-50 p-5 sm:grid-cols-[auto_1fr]">
                        {qrDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={qrDataUrl}
                                alt="Pairing QR code"
                                className="mx-auto h-40 w-40 rounded-lg bg-white p-2 shadow-sm"
                            />
                        ) : (
                            <Skeleton className="h-40 w-40 rounded-lg" />
                        )}
                        <div className="flex flex-col justify-center">
                            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
                                Pairing code
                            </p>
                            <p className="mt-2 font-mono text-5xl font-bold tracking-[0.25em] text-slate-900">
                                {pairing.pairingCode}
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                                Expires in{" "}
                                <span className="font-medium text-slate-900">{expiresIn}</span>{" "}
                                · single use
                            </p>
                            <button
                                type="button"
                                className="mt-3 w-fit text-sm text-indigo-600 hover:underline"
                                onClick={() => setPairing(null)}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* Device list */}
            <section>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900">
                        Paired devices
                    </h2>
                    <span className="text-sm text-slate-500">
                        {devices.length} device{devices.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5"
                            >
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <div className="flex flex-col gap-2 flex-1">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-64" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : devices.length === 0 ? (
                    <EmptyState
                        icon={<Scan className="h-7 w-7" />}
                        title="No scanner devices yet"
                        description="Generate a pairing code above to connect the first device."
                    />
                ) : (
                    <div className="space-y-3">
                        {devices.map((d) => (
                            <DeviceCard
                                key={d.publicId}
                                device={d}
                                onRename={renameDevice}
                                onRevoke={revokeDevice}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
