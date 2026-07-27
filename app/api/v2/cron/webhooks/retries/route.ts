import { NextRequest, NextResponse } from "next/server";
import { processDueRetries } from "@/modules/webhooks";

/**
 * Opportunistic / cron-friendly retry sweeper.
 * Protect with CRON_SECRET when set: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (secret) {
        const auth = request.headers.get("authorization") || "";
        if (auth !== `Bearer ${secret}`) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }
    }

    const processed = await processDueRetries(50);
    return NextResponse.json({ success: true, data: { processed } });
}

export async function GET(request: NextRequest) {
    return POST(request);
}
