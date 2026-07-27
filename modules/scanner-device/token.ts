import jwt from "jsonwebtoken";
import { getScannerTokenSecret } from "@/modules/scanner-device/helpers";
import type { ScannerSessionPayload } from "@/modules/scanner-device/types";
import { UnauthorizedError } from "@/core/errors/AppError";

export function signScannerToken(payload: {
    deviceId: string;
    workspaceId: string;
    eventId: string;
    gate: string;
}): string {
    const body: ScannerSessionPayload = {
        deviceId: payload.deviceId,
        workspaceId: payload.workspaceId,
        eventId: payload.eventId,
        gate: payload.gate,
        typ: "scanner",
    };
    return jwt.sign(body, getScannerTokenSecret(), {
        expiresIn: "30d",
        subject: payload.deviceId,
    });
}

export function verifyScannerToken(token: string): ScannerSessionPayload {
    try {
        const decoded = jwt.verify(token, getScannerTokenSecret()) as
            | ScannerSessionPayload
            | string;
        if (typeof decoded === "string" || decoded.typ !== "scanner") {
            throw new UnauthorizedError("Invalid scanner session");
        }
        if (
            !decoded.deviceId ||
            !decoded.workspaceId ||
            !decoded.eventId
        ) {
            throw new UnauthorizedError("Invalid scanner session");
        }
        return decoded;
    } catch (e) {
        if (e instanceof UnauthorizedError) throw e;
        throw new UnauthorizedError("Invalid or expired scanner session");
    }
}

export function extractBearerToken(request: Request): string | null {
    const header = request.headers.get("authorization") || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || null;
}
