import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
import { createManualEntry } from "@/modules/access-event/service";

type RouteParams = {
    params: Promise<{ eventId: string }> | { eventId: string };
};

const schema = z.object({
    attendeeId: z.string().trim().min(1),
    gate: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(500).optional(),
    deviceId: z.string().trim().max(120).nullable().optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.ACCESS_VALIDATE, async (ctx) => {
        const resolved = params instanceof Promise ? await params : params;
        const body = await request.json();
        const input = schema.parse(body);
        const data = await createManualEntry({
            workspaceId: ctx.workspaceId,
            eventId: resolved.eventId,
            attendeePublicId: input.attendeeId,
            userId: ctx.createdByUserId,
            gate: input.gate,
            notes: input.notes,
            deviceId: input.deviceId,
        });
        return publicOk(data, 201);
    });
}
