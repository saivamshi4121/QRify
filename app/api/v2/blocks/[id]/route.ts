import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { updateBlockSchema } from "@/modules/smartpage/validation";
import { deleteBlock, updateBlock } from "@/modules/smartpage/service";
import { blockRegistry } from "@/modules/smartpage/blockRegistry";
import { BadRequestError } from "@/core/errors/AppError";

type RouteParams = {
    params: Promise<{ id: string }> | { id: string };
};

async function resolveBlockId(params: RouteParams["params"]) {
    const resolved = params instanceof Promise ? await params : params;
    return resolved.id;
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const blockId = await resolveBlockId(params);
        const body = await request.json();
        const input = updateBlockSchema.parse(body);

        if (input.blockType && !blockRegistry.isRegistered(input.blockType)) {
            throw new BadRequestError("Unsupported block type");
        }

        if (input.config !== undefined && input.blockType) {
            input.config = blockRegistry.validateConfig(
                input.blockType,
                input.config
            );
        }

        const block = await updateBlock(blockId, workspaceId, input);
        return NextResponse.json({ success: true, data: block });
    } catch (error) {
        return handleApiError(error, "Update Block Error");
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const blockId = await resolveBlockId(params);
        const result = await deleteBlock(blockId, workspaceId);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        return handleApiError(error, "Delete Block Error");
    }
}
