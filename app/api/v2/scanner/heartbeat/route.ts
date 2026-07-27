import { NextResponse } from "next/server";
import { handleApiError } from "@/core/errors/handleApiError";
import { resolveScannerSession } from "@/core/scanner/resolveScannerSession";
import { heartbeatDevice } from "@/modules/scanner-device/service";
import { z } from "zod";

const heartbeatSchema = z.object({
    appVersion: z.string().trim().max(40).optional().nullable(),
});

export async function POST(request: Request) {
    try {
        const session = await resolveScannerSession(request);
        const body = await request.json().catch(() => ({}));
        const input = heartbeatSchema.parse(body);
        const data = await heartbeatDevice({
            devicePublicId: session.deviceId,
            appVersion: input.appVersion,
        });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Scanner Heartbeat Error");
    }
}
