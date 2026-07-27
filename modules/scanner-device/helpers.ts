import crypto from "crypto";
import {
    ONLINE_THRESHOLD_MS,
    ScannerDeviceStatus,
    ScannerDeviceStatusValue,
} from "@/modules/scanner-device/constants";

export function generateScannerPublicId(): string {
    return `scd_${crypto.randomBytes(4).toString("hex")}`;
}

/** Cryptographically random 6-digit code (000000–999999). */
export function generatePairingCode(): string {
    const n = crypto.randomInt(0, 1_000_000);
    return n.toString().padStart(6, "0");
}

export function hashPairingCode(code: string): string {
    const pepper =
        process.env.SCANNER_TOKEN_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        "qrezo-scanner-dev";
    return crypto
        .createHash("sha256")
        .update(`${code.trim()}:${pepper}`)
        .digest("hex");
}

export function getScannerTokenSecret(): string {
    const secret =
        process.env.SCANNER_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
        throw new Error("SCANNER_TOKEN_SECRET or NEXTAUTH_SECRET is required");
    }
    return secret;
}

export function computeDisplayStatus(
    status: ScannerDeviceStatusValue,
    lastSeen: Date | null | undefined
): ScannerDeviceStatusValue {
    if (
        status === ScannerDeviceStatus.DISABLED ||
        status === ScannerDeviceStatus.PAIRING
    ) {
        return status;
    }
    if (!lastSeen) return ScannerDeviceStatus.OFFLINE;
    const age = Date.now() - new Date(lastSeen).getTime();
    return age <= ONLINE_THRESHOLD_MS
        ? ScannerDeviceStatus.ONLINE
        : ScannerDeviceStatus.OFFLINE;
}

export function buildPairingQrPayload(code: string): string {
    const base = (
        process.env.NEXT_PUBLIC_SCANNER_URL ||
        process.env.SCANNER_PUBLIC_URL ||
        "http://localhost:3001"
    ).replace(/\/$/, "");
    return `${base}/pair?code=${encodeURIComponent(code)}`;
}
