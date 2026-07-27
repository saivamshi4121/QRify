import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import { restoreCredential } from "@/modules/event-credential/service";

type RouteParams = {
    params:
        | Promise<{ eventId: string; publicId: string }>
        | { eventId: string; publicId: string };
};

async function resolveParams(params: RouteParams["params"]) {
    return params instanceof Promise ? await params : params;
}

export async function POST(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const { eventId, publicId } = await resolveParams(params);
        const credential = await restoreCredential(
            workspaceId,
            eventId,
            publicId
        );
        return NextResponse.json({ success: true, data: credential });
    } catch (error) {
        return handleApiError(error, "Restore Credential Error");
    }
}
