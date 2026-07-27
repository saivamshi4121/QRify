"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ArrowLeft,
    Loader2,
    Plus,
    RefreshCw,
    ShieldOff,
    Pencil,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import QRCode from "qrcode";

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

function statusColor(status: string) {
    switch (status) {
        case "ONLINE":
            return "bg-emerald-50 text-emerald-700 ring-emerald-200";
        case "OFFLINE":
            return "bg-slate-100 text-slate-600 ring-slate-200";
        case "PAIRING":
            return "bg-amber-50 text-amber-700 ring-amber-200";
        case "DISABLED":
            return "bg-red-50 text-red-700 ring-red-200";
        default:
            return "bg-slate-100 text-slate-600 ring-slate-200";
    }
}

function formatWhen(iso: string | null) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
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
            const res = await fetch(
                `/api/v2/events/${eventId}/scanner-devices`
            );
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
        QRCode.toDataURL(pairing.pairingQr, {
            width: 240,
            margin: 2,
        }).then(setQrDataUrl);
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
        if (
            !confirm(
                `Revoke "${device.name}"? It will need to be paired again.`
            )
        ) {
            return;
        }
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

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Toaster richColors position="top-right" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <Link
                        href={`/events/${eventId}`}
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
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
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">
                    Pair new scanner
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Generate a 6-digit code (expires in 5 minutes). Volunteers
                    enter it on scanner.qrezo.com.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="flex-1 text-sm text-slate-600">
                        Device name
                        <input
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
                            placeholder="Gate Scanner"
                        />
                    </label>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={startPairing}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        Generate pairing code
                    </button>
                </div>

                {pairing ? (
                    <div className="mt-5 grid gap-5 rounded-lg bg-slate-50 p-4 sm:grid-cols-[auto_1fr]">
                        {qrDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={qrDataUrl}
                                alt="Pairing QR"
                                className="mx-auto h-44 w-44 rounded-md bg-white p-2"
                            />
                        ) : null}
                        <div className="flex flex-col justify-center">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Pairing code
                            </p>
                            <p className="mt-1 font-mono text-4xl font-bold tracking-[0.25em] text-slate-900">
                                {pairing.pairingCode}
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                                Expires in {expiresIn} · single use
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
                ) : null}
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-3">
                    <h2 className="text-sm font-semibold text-slate-900">
                        Paired devices
                    </h2>
                </div>
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                    </div>
                ) : devices.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-slate-500">
                        No scanners yet. Generate a pairing code to connect the
                        first device.
                    </p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {devices.map((d) => (
                            <li
                                key={d.publicId}
                                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium text-slate-900">
                                            {d.name}
                                        </p>
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColor(d.status)}`}
                                        >
                                            {d.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Gate: {d.gate || "Not set"} · Last seen:{" "}
                                        {formatWhen(d.lastSeen)}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Operator:{" "}
                                        {d.operator?.name ||
                                            d.operator?.email ||
                                            "—"}
                                        {d.appVersion
                                            ? ` · v${d.appVersion}`
                                            : ""}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => renameDevice(d)}
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Rename
                                    </button>
                                    {d.status !== "DISABLED" ? (
                                        <button
                                            type="button"
                                            onClick={() => revokeDevice(d)}
                                            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50"
                                        >
                                            <ShieldOff className="h-3.5 w-3.5" />
                                            Revoke
                                        </button>
                                    ) : null}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
