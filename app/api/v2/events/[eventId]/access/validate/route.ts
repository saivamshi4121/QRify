import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { validateAccessSchema } from "@/modules/access-event/validation";
import { validateAccess } from "@/modules/access-event/service";

type RouteParams = {
    params: Promise<{ eventId: string }> | { eventId: string };
};

async function resolveEventId(params: RouteParams["params"]) {
    const resolved = params instanceof Promise ? await params : params;
    return resolved.eventId;
}

/** Validate credential token and record an access attempt for this event. */
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, userId } = await resolveWorkspace();
        const eventId = await resolveEventId(params);
        const body = await request.json();
        const input = validateAccessSchema.parse(body);
        const data = await validateAccess({
            token: input.token,
            workspaceId,
            eventId,
            userId,
            type: input.type,
            gate: input.gate,
            deviceId: input.deviceId,
            notes: input.notes,
        });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Validate Access Error");
    }
}
