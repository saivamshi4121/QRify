import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { updateSmartPageSchema } from "@/modules/smartpage/validation";
import {
    deleteSmartPage,
    getSmartPageForWorkspace,
    updateSmartPage,
} from "@/modules/smartpage/service";

type RouteParams = {
    params: Promise<{ id: string }> | { id: string };
};

async function resolveId(params: RouteParams["params"]) {
    const resolved = params instanceof Promise ? await params : params;
    return resolved.id;
}

export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const id = await resolveId(params);
        const page = await getSmartPageForWorkspace(id, workspaceId);
        return NextResponse.json({ success: true, data: page });
    } catch (error) {
        return handleApiError(error, "Get SmartPage Error");
    }
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const id = await resolveId(params);
        const body = await request.json();
        const input = updateSmartPageSchema.parse(body);
        const page = await updateSmartPage(id, workspaceId, input);
        return NextResponse.json({ success: true, data: page });
    } catch (error) {
        return handleApiError(error, "Update SmartPage Error");
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const id = await resolveId(params);
        const result = await deleteSmartPage(id, workspaceId);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        return handleApiError(error, "Delete SmartPage Error");
    }
}
