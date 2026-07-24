import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { updateFeedbackStatusSchema } from "@/modules/feedback/validation";
import { updateFeedbackStatus } from "@/modules/feedback/service";

type RouteParams = {
    params: Promise<{ id: string }> | { id: string };
};

async function resolveId(params: RouteParams["params"]) {
    const resolved = params instanceof Promise ? await params : params;
    return resolved.id;
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const id = await resolveId(params);
        const body = await request.json();
        const { status } = updateFeedbackStatusSchema.parse(body);
        const data = await updateFeedbackStatus(id, workspaceId, status);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Update Feedback Status Error");
    }
}
