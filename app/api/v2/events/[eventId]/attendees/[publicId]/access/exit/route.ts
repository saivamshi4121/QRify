import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { manualAccessSchema } from "@/modules/access-event/validation";
import { createManualExit } from "@/modules/access-event/service";

type RouteParams = {
    params:
        | Promise<{ eventId: string; publicId: string }>
        | { eventId: string; publicId: string };
};

async function resolveParams(params: RouteParams["params"]) {
    return params instanceof Promise ? await params : params;
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, userId } = await resolveWorkspace();
        const { eventId, publicId } = await resolveParams(params);
        const body = await request.json().catch(() => ({}));
        const input = manualAccessSchema.parse(body || {});
        const data = await createManualExit({
            workspaceId,
            eventId,
            attendeePublicId: publicId,
            userId,
            gate: input.gate,
            notes: input.notes,
            deviceId: input.deviceId,
        });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Manual Exit Error");
    }
}
