import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import {
    getWebhookDelivery,
    replayWebhookDelivery,
} from "@/modules/webhooks";

type RouteParams = {
    params: Promise<{ deliveryId: string }> | { deliveryId: string };
};

async function id(params: RouteParams["params"]) {
    const r = params instanceof Promise ? await params : params;
    return r.deliveryId;
}

export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const data = await getWebhookDelivery(workspaceId, await id(params));
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Get Delivery Error");
    }
}

export async function POST(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const data = await replayWebhookDelivery(
            workspaceId,
            await id(params)
        );
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Replay Delivery Error");
    }
}
