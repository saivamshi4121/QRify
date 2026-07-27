import { NextResponse } from "next/server";
import { handleApiError } from "@/core/errors/handleApiError";
import { resolveScannerSession } from "@/core/scanner/resolveScannerSession";
import { getSessionForDevice } from "@/modules/scanner-device/service";

/** Refresh / validate current scanner session. */
export async function GET(request: Request) {
    try {
        const session = await resolveScannerSession(request);
        const data = await getSessionForDevice(session.deviceId);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Scanner Session Error");
    }
}
