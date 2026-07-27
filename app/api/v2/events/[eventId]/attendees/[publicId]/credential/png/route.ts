import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import { downloadPNG } from "@/modules/event-credential/service";

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
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const { eventId, publicId } = await resolveParams(params);
        const { buffer, filename } = await downloadPNG(
            workspaceId,
            eventId,
            publicId
        );
        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        return handleApiError(error, "Download Credential PNG Error");
    }
}
