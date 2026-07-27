import { NextRequest } from "next/server";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
import {
    createAttendeeSchema,
    listAttendeesQuerySchema,
} from "@/modules/attendee/validation";
import {
    createAttendee,
    listAttendees,
} from "@/modules/attendee/service";
import { RegistrationSource } from "@/modules/attendee/constants";

type RouteParams = {
    params: Promise<{ eventId: string }> | { eventId: string };
};

async function id(params: RouteParams["params"]) {
    const r = params instanceof Promise ? await params : params;
    return r.eventId;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.ATTENDEES_READ, async (ctx) => {
        const eventId = await id(params);
        const url = new URL(request.url);
        const query = listAttendeesQuerySchema.parse({
            q: url.searchParams.get("q") || undefined,
            status: url.searchParams.get("status") || undefined,
            ticketType: url.searchParams.get("ticketType") || undefined,
            page: url.searchParams.get("page") || undefined,
            limit: url.searchParams.get("limit") || undefined,
        });
        const data = await listAttendees(ctx.workspaceId, eventId, query);
        return publicOk(data);
    });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.ATTENDEES_WRITE, async (ctx) => {
        const eventId = await id(params);
        const body = await request.json();
        const input = createAttendeeSchema.parse({
            ...body,
            registrationSource:
                body.registrationSource || RegistrationSource.API,
        });
        const attendee = await createAttendee(
            ctx.workspaceId,
            eventId,
            input
        );
        return publicOk(attendee, 201);
    });
}
