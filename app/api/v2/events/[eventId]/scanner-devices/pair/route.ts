import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import { createPairingSchema } from "@/modules/scanner-device/validation";
import { createPairing } from "@/modules/scanner-device/service";

type RouteParams = {
    params: Promise<{ eventId: string }> | { eventId: string };
};

async function resolveEventId(params: RouteParams["params"]) {
    const resolved = params instanceof Promise ? await params : params;
    return resolved.eventId;
}

/** Create a single-use pairing code + QR for a new scanner device. */
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, userId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const eventId = await resolveEventId(params);
        const body = await request.json().catch(() => ({}));
        const input = createPairingSchema.parse(body);
        const data = await createPairing({
            workspaceId,
            eventId,
            userId,
            name: input.name,
            gate: input.gate,
        });
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Create Scanner Pairing Error");
    }
}
