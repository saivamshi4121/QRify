import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import { revokeCredentialSchema } from "@/modules/event-credential/validation";
import { revokeCredential } from "@/modules/event-credential/service";

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
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const { eventId, publicId } = await resolveParams(params);
        const body = await request.json().catch(() => ({}));
        const input = revokeCredentialSchema.parse(body || {});
        const credential = await revokeCredential(
            workspaceId,
            eventId,
            publicId,
            input.reason
        );
        return NextResponse.json({ success: true, data: credential });
    } catch (error) {
        return handleApiError(error, "Revoke Credential Error");
    }
}
