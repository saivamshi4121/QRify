import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { bulkImportPreviewSchema } from "@/modules/attendee/validation";
import { bulkImportPreview } from "@/modules/attendee/service";
import { assertCanManageEvents } from "@/modules/event/service";

type RouteParams = {
    params: Promise<{ eventId: string }> | { eventId: string };
};

async function resolveEventId(params: RouteParams["params"]) {
    const resolved = params instanceof Promise ? await params : params;
    return resolved.eventId;
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const eventId = await resolveEventId(params);
        const body = await request.json();
        const input = bulkImportPreviewSchema.parse(body);
        const data = await bulkImportPreview(workspaceId, eventId, input);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Attendee Import Preview Error");
    }
}
