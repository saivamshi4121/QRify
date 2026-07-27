export const SCANNER_SESSION_KEY = "qrezo.scanner.session.v2";
export const APP_VERSION = "1.1.0";

export type ScannerSession = {
    token: string;
    deviceId: string;
    deviceName: string;
    workspaceId: string;
    workspaceName: string;
    eventId: string;
    eventName: string;
    gate: string;
    eventStatus?: string;
};

export function loadSession(): ScannerSession | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(SCANNER_SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as ScannerSession;
        if (
            !parsed.token ||
            !parsed.deviceId ||
            !parsed.workspaceId ||
            !parsed.eventId
        ) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function saveSession(session: ScannerSession) {
    localStorage.setItem(SCANNER_SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
    localStorage.removeItem(SCANNER_SESSION_KEY);
}

export function updateSessionGate(gate: string) {
    const s = loadSession();
    if (!s) return null;
    const next = { ...s, gate };
    saveSession(next);
    return next;
}

export const DEFAULT_GATES = [
    "Main",
    "VIP",
    "Staff",
    "Backstage",
    "Exit",
];

export function deviceFingerprint(): string {
    if (typeof window === "undefined") return "server";
    const parts = [
        navigator.userAgent,
        navigator.language,
        String(screen.width),
        String(screen.height),
    ];
    let hash = 0;
    const str = parts.join("|");
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return `fp_${Math.abs(hash).toString(16)}`;
}
