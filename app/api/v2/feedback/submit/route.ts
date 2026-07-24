import { NextResponse } from "next/server";
import { submitFeedbackSchema } from "@/modules/feedback/validation";
import { submitFeedback } from "@/modules/feedback/service";
import { handleApiError } from "@/core/errors/handleApiError";

const ipRateLimit = new Map<string, { count: number; lastReset: number }>();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = ipRateLimit.get(ip) || { count: 0, lastReset: now };
    if (now - record.lastReset > RATE_WINDOW_MS) {
        record.count = 0;
        record.lastReset = now;
    }
    if (record.count >= RATE_MAX) return false;
    record.count += 1;
    ipRateLimit.set(ip, record);
    return true;
}

export async function POST(request: Request) {
    try {
        const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            "unknown";

        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { success: false, message: "Rate limit exceeded. Try again later." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const input = submitFeedbackSchema.parse(body);
        const result = await submitFeedback(input);

        return NextResponse.json(
            { success: true, data: result },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error, "Feedback Submit Error");
    }
}
