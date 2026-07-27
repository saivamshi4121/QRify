import { NextResponse } from "next/server";
import { handleApiError } from "@/core/errors/handleApiError";
import { resolveScannerSession } from "@/core/scanner/resolveScannerSession";
import { scannerValidateSchema } from "@/modules/scanner-device/validation";
import {
    markDeviceScan,
    requireActiveDevice,
} from "@/modules/scanner-device/service";
import { validateAccess } from "@/modules/access-event/service";

/**
 * Scanner-authenticated access validation.
 * Uses device session — no organizer credentials required.
 */
export async function POST(request: Request) {
    try {
        const session = await resolveScannerSession(request);
        const device = await requireActiveDevice(session.deviceId);
        const body = await request.json();
        const input = scannerValidateSchema.parse(body);
        const gate = input.gate || device.gate || session.gate || "Main";

        const data = await validateAccess({
            token: input.token,
            workspaceId: session.workspaceId,
            eventId: session.eventId,
            userId: device.pairedBy ? String(device.pairedBy) : null,
            type: input.type,
            gate,
            deviceId: session.deviceId,
        });

        await markDeviceScan(session.deviceId);

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Scanner Validate Access Error");
    }
}
