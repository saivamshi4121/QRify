import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { UnauthorizedError } from "@/core/errors/AppError";
import { staffSessionSchema } from "@/modules/scanner-device/validation";
import { createStaffSession } from "@/modules/scanner-device/service";

/** Staff login path: create a paired scanner session from NextAuth. */
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }
        const { workspaceId, userId } = await resolveWorkspace();
        const body = await request.json();
        const input = staffSessionSchema.parse(body);
        const data = await createStaffSession({
            workspaceId,
            userId,
            eventId: input.eventId,
            gate: input.gate,
            deviceName: input.deviceName,
            deviceFingerprint: input.deviceFingerprint,
            appVersion: input.appVersion,
        });
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Staff Scanner Session Error");
    }
}
