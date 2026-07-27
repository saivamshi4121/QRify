import { NextRequest } from "next/server";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
import { updateAttendeeSchema } from "@/modules/attendee/validation";
import {
    deleteAttendee,
    getAttendee,
    updateAttendee,
} from "@/modules/attendee/service";

type RouteParams = {
    params:
        | Promise<{ eventId: string; publicId: string }>
        | { eventId: string; publicId: string };
};

async function ids(params: RouteParams["params"]) {
    const r = params instanceof Promise ? await params : params;
    return { eventId: r.eventId, publicId: r.publicId };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.ATTENDEES_READ, async (ctx) => {
        const { eventId, publicId } = await ids(params);
        const attendee = await getAttendee(
            ctx.workspaceId,
            eventId,
            publicId
        );
        return publicOk(attendee);
    });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.ATTENDEES_WRITE, async (ctx) => {
        const { eventId, publicId } = await ids(params);
        const body = await request.json();
        const input = updateAttendeeSchema.parse(body);
        const attendee = await updateAttendee(
            ctx.workspaceId,
            eventId,
            publicId,
            input
        );
        return publicOk(attendee);
    });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.ATTENDEES_WRITE, async (ctx) => {
        const { eventId, publicId } = await ids(params);
        await deleteAttendee(ctx.workspaceId, eventId, publicId);
        return publicOk({ deleted: true });
    });
}
