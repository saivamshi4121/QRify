import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { duplicateSmartPage } from "@/modules/smartpage/service";

type RouteParams = {
    params: Promise<{ id: string }> | { id: string };
};

async function resolveId(params: RouteParams["params"]) {
    const resolved = params instanceof Promise ? await params : params;
    return resolved.id;
}

export async function POST(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const id = await resolveId(params);
        const page = await duplicateSmartPage(id, workspaceId);
        return NextResponse.json({ success: true, data: page }, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Duplicate SmartPage Error");
    }
}
