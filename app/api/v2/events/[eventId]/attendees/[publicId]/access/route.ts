import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { getAccessTimeline } from "@/modules/access-event/service";

type RouteParams = {
    params:
        | Promise<{ eventId: string; publicId: string }>
        | { eventId: string; publicId: string };
};

async function resolveParams(params: RouteParams["params"]) {
    return params instanceof Promise ? await params : params;
}

export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const { eventId, publicId } = await resolveParams(params);
        const data = await getAccessTimeline(workspaceId, eventId, publicId);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Attendee Access Timeline Error");
    }
}
