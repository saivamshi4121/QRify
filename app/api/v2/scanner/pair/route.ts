import { NextResponse } from "next/server";
import { handleApiError } from "@/core/errors/handleApiError";
import { pairScannerSchema } from "@/modules/scanner-device/validation";
import { pairWithCode } from "@/modules/scanner-device/service";

/** Public: redeem a 6-digit pairing code for a scanner session token. */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const input = pairScannerSchema.parse(body);
        const data = await pairWithCode({
            pairingCode: input.pairingCode,
            deviceFingerprint: input.deviceFingerprint,
            appVersion: input.appVersion,
            deviceName: input.deviceName,
        });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Scanner Pair Error");
    }
}
