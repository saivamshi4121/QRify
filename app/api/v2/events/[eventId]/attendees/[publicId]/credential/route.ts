import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import { createCredentialSchema } from "@/modules/event-credential/validation";
import {
    createCredential,
    getCredential,
} from "@/modules/event-credential/service";

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
        const credential = await getCredential(workspaceId, eventId, publicId);
        return NextResponse.json({ success: true, data: credential });
    } catch (error) {
        return handleApiError(error, "Get Credential Error");
    }
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const { eventId, publicId } = await resolveParams(params);
        const body = await request.json().catch(() => ({}));
        const input = createCredentialSchema.parse(body || {});
        const credential = await createCredential(
            workspaceId,
            eventId,
            publicId,
            { expiresAt: input.expiresAt ?? null }
        );
        return NextResponse.json(
            { success: true, data: credential },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error, "Create Credential Error");
    }
}
