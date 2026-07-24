import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { createBlockSchema } from "@/modules/smartpage/validation";
import { createBlock, listBlocks } from "@/modules/smartpage/service";
import { blockRegistry } from "@/modules/smartpage/blockRegistry";

type RouteParams = {
    params: Promise<{ id: string }> | { id: string };
};

async function resolvePageId(params: RouteParams["params"]) {
    const resolved = params instanceof Promise ? await params : params;
    return resolved.id;
}

export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const pageId = await resolvePageId(params);
        const blocks = await listBlocks(pageId, workspaceId);
        return NextResponse.json({ success: true, data: blocks });
    } catch (error) {
        return handleApiError(error, "List Blocks Error");
    }
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const pageId = await resolvePageId(params);
        const body = await request.json();
        const input = createBlockSchema.parse(body);

        const config = blockRegistry.validateConfig(
            input.blockType,
            input.config ?? {}
        );

        const block = await createBlock(pageId, workspaceId, {
            ...input,
            config,
        });

        return NextResponse.json({ success: true, data: block }, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Create Block Error");
    }
}
