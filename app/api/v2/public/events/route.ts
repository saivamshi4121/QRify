import { NextRequest } from "next/server";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
import { publicEvent } from "@/modules/api-key/publicSerializers";
import {
    createEventSchema,
} from "@/modules/event/validation";
import {
    createEvent,
    listEvents,
} from "@/modules/event/service";

export async function GET(request: NextRequest) {
    return withApiKey(request, ApiKeyScope.EVENTS_READ, async (ctx) => {
        const url = new URL(request.url);
        const events = await listEvents(ctx.workspaceId, {
            q: url.searchParams.get("q") || undefined,
            status: (url.searchParams.get("status") as never) || undefined,
            sort: (url.searchParams.get("sort") as never) || undefined,
        });
        return publicOk(
            (events as Record<string, unknown>[]).map((e) => publicEvent(e))
        );
    });
}

export async function POST(request: NextRequest) {
    return withApiKey(request, ApiKeyScope.EVENTS_WRITE, async (ctx) => {
        const body = await request.json();
        const input = createEventSchema.parse(body);
        const event = await createEvent(
            ctx.workspaceId,
            ctx.createdByUserId,
            input
        );
        return publicOk(publicEvent(event.toObject()), 201);
    });
}
