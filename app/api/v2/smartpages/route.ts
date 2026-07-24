import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { createSmartPageSchema } from "@/modules/smartpage/validation";
import {
    createSmartPage,
    listSmartPages,
} from "@/modules/smartpage/service";

export async function GET() {
    try {
        const { workspaceId } = await resolveWorkspace();
        const pages = await listSmartPages(workspaceId);
        return NextResponse.json({ success: true, data: pages });
    } catch (error) {
        return handleApiError(error, "List SmartPages Error");
    }
}

export async function POST(request: Request) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const body = await request.json();
        const input = createSmartPageSchema.parse(body);
        const page = await createSmartPage(workspaceId, input);
        return NextResponse.json(
            { success: true, data: page },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error, "Create SmartPage Error");
    }
}
