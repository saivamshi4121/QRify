import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
import { validateAccess } from "@/modules/access-event/service";
import { ACCESS_TYPE_VALUES, AccessType } from "@/modules/access-event/constants";

type RouteParams = {
    params: Promise<{ eventId: string }> | { eventId: string };
};

const schema = z.object({
    token: z.string().trim().min(1),
    gate: z.string().trim().max(120).optional(),
    type: z.enum(ACCESS_TYPE_VALUES).optional().default(AccessType.ENTRY),
    deviceId: z.string().trim().max(120).nullable().optional(),
    notes: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.ACCESS_VALIDATE, async (ctx) => {
        const resolved = params instanceof Promise ? await params : params;
        const body = await request.json();
        const input = schema.parse(body);
        const data = await validateAccess({
            token: input.token,
            workspaceId: ctx.workspaceId,
            eventId: resolved.eventId,
            userId: ctx.createdByUserId,
            type: input.type,
            gate: input.gate,
            deviceId: input.deviceId,
            notes: input.notes,
        });
        return publicOk(data);
    });
}
