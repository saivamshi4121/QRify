import { NextResponse } from "next/server";
import { handleApiError } from "@/core/errors/handleApiError";
import { resolveScannerSession } from "@/core/scanner/resolveScannerSession";
import { unpairDevice } from "@/modules/scanner-device/service";

export async function POST(request: Request) {
    try {
        const session = await resolveScannerSession(request);
        const data = await unpairDevice(session.deviceId);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Scanner Unpair Error");
    }
}
