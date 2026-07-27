import { NextResponse } from "next/server";
import { handleApiError } from "@/core/errors/handleApiError";
import { resolveScannerSession } from "@/core/scanner/resolveScannerSession";
import { updateDeviceGateSchema } from "@/modules/scanner-device/validation";
import { setDeviceGateFromScanner } from "@/modules/scanner-device/service";

export async function PATCH(request: Request) {
    try {
        const session = await resolveScannerSession(request);
        const body = await request.json();
        const input = updateDeviceGateSchema.parse(body);
        const data = await setDeviceGateFromScanner({
            devicePublicId: session.deviceId,
            gate: input.gate,
        });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Scanner Gate Update Error");
    }
}
