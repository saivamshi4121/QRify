import {
    extractBearerToken,
    verifyScannerToken,
} from "@/modules/scanner-device/token";
import { requireActiveDevice } from "@/modules/scanner-device/service";
import type { ScannerSessionPayload } from "@/modules/scanner-device/types";
import { UnauthorizedError } from "@/core/errors/AppError";

export type ResolvedScanner = ScannerSessionPayload & {
    deviceName: string;
    gate: string;
};

/**
 * Resolve scanner session from Authorization: Bearer <scanner_token>.
 */
export async function resolveScannerSession(
    request: Request
): Promise<ResolvedScanner> {
    const token = extractBearerToken(request);
    if (!token) {
        throw new UnauthorizedError("Missing scanner session");
    }
    const payload = verifyScannerToken(token);
    const device = await requireActiveDevice(payload.deviceId);
    return {
        ...payload,
        deviceName: device.name,
        gate: device.gate || payload.gate || "",
    };
}
