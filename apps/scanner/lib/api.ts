import type { ScannerSession } from "@/lib/session";
import { APP_VERSION, deviceFingerprint } from "@/lib/session";

export type ValidateAccessData = {
    allowed: boolean;
    result: string;
    message: string;
    attendee: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        ticketType?: string;
    } | null;
    event: {
        id: string;
        name: string;
        slug: string;
        status: string;
    } | null;
    accessEvent: {
        gate: string;
        occurredAt: string;
        result: string;
    };
    previousEntryAt?: string | null;
};

export type ScanHistoryItem = {
    id: string;
    status: string;
    time: string;
    attendee: string;
};

export type PlatformSessionData = {
    token: string;
    device: {
        id: string;
        publicId: string;
        name: string;
        gate: string;
        status: string;
    };
    workspace: { id: string; name: string };
    event: { id: string; name: string; status: string };
    gate: string;
};

/** Extract opaque credential token from QR payload (URL or raw token). */
export function extractTokenFromQr(raw: string): string | null {
    const value = raw.trim();
    if (!value) return null;
    try {
        const url = new URL(value);
        const token = url.searchParams.get("token");
        if (token) return token;
        const code = url.searchParams.get("code");
        if (code && /^\d{6}$/.test(code)) return null; // pairing QR, not credential
    } catch {
        // not a URL
    }
    if (value.includes("token=")) {
        const match = value.match(/[?&]token=([^&#]+)/);
        if (match?.[1]) return decodeURIComponent(match[1]);
    }
    if (/^[A-Za-z0-9_-]{16,}$/.test(value)) return value;
    return null;
}

/** Extract 6-digit pairing code from typed input or pairing QR URL. */
export function extractPairingCode(raw: string): string | null {
    const value = raw.trim();
    if (/^\d{6}$/.test(value)) return value;
    try {
        const url = new URL(value);
        const code = url.searchParams.get("code");
        if (code && /^\d{6}$/.test(code)) return code;
    } catch {
        // ignore
    }
    const match = value.match(/\b(\d{6})\b/);
    return match?.[1] || null;
}

async function parseJson(res: Response) {
    const json = await res.json();
    if (!res.ok || json.success === false) {
        const err = new Error(json.message || `Request failed (${res.status})`);
        (err as Error & { status?: number; code?: string }).status = res.status;
        throw err;
    }
    return json.data;
}

export async function apiGet<T>(
    path: string,
    opts?: { workspaceId?: string; scannerToken?: string }
): Promise<T> {
    const headers: HeadersInit = {};
    if (opts?.workspaceId) headers["x-workspace-id"] = opts.workspaceId;
    if (opts?.scannerToken) {
        headers.Authorization = `Bearer ${opts.scannerToken}`;
    }
    const res = await fetch(`/api/proxy/${path}`, {
        headers,
        cache: "no-store",
    });
    return parseJson(res) as Promise<T>;
}

export async function apiPost<T>(
    path: string,
    body: unknown,
    opts?: { workspaceId?: string; scannerToken?: string }
): Promise<T> {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (opts?.workspaceId) headers["x-workspace-id"] = opts.workspaceId;
    if (opts?.scannerToken) {
        headers.Authorization = `Bearer ${opts.scannerToken}`;
    }
    const res = await fetch(`/api/proxy/${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
    });
    return parseJson(res) as Promise<T>;
}

export async function apiPatch<T>(
    path: string,
    body: unknown,
    opts?: { workspaceId?: string; scannerToken?: string }
): Promise<T> {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (opts?.workspaceId) headers["x-workspace-id"] = opts.workspaceId;
    if (opts?.scannerToken) {
        headers.Authorization = `Bearer ${opts.scannerToken}`;
    }
    const res = await fetch(`/api/proxy/${path}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
    });
    return parseJson(res) as Promise<T>;
}

export function toLocalSession(data: PlatformSessionData): ScannerSession {
    return {
        token: data.token,
        deviceId: data.device.publicId || data.device.id,
        deviceName: data.device.name,
        workspaceId: data.workspace.id,
        workspaceName: data.workspace.name,
        eventId: data.event.id,
        eventName: data.event.name,
        gate: data.gate || data.device.gate || "",
        eventStatus: data.event.status,
    };
}

export async function pairWithCode(code: string): Promise<PlatformSessionData> {
    return apiPost<PlatformSessionData>("scanner/pair", {
        pairingCode: code,
        deviceFingerprint: deviceFingerprint(),
        appVersion: APP_VERSION,
    });
}

export async function createStaffScannerSession(input: {
    eventId: string;
    gate: string;
    workspaceId: string;
    deviceName?: string;
}): Promise<PlatformSessionData> {
    return apiPost<PlatformSessionData>(
        "scanner/staff-session",
        {
            eventId: input.eventId,
            gate: input.gate,
            deviceName: input.deviceName,
            deviceFingerprint: deviceFingerprint(),
            appVersion: APP_VERSION,
        },
        { workspaceId: input.workspaceId }
    );
}

export function attendeeDisplayName(
    attendee: ValidateAccessData["attendee"]
): string {
    if (!attendee) return "Unknown";
    const name = `${attendee.firstName || ""} ${attendee.lastName || ""}`.trim();
    return name || attendee.email || "Unknown";
}

export function resultTone(result: string): "success" | "warn" | "denied" {
    if (result === "SUCCESS") return "success";
    if (result === "ALREADY_ENTERED") return "warn";
    return "denied";
}

export function isUnpairedError(e: unknown): boolean {
    const msg = e instanceof Error ? e.message : "";
    return (
        msg.toLowerCase().includes("no longer paired") ||
        msg.toLowerCase().includes("invalid or expired scanner") ||
        msg.toLowerCase().includes("missing scanner session")
    );
}
