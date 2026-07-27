import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import {
    getNotificationDelivery,
    retryNotificationDelivery,
} from "@/modules/notifications";

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
        const data = await getNotificationDelivery(
            workspaceId,
            await id(params)
        );
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Get Notification Delivery Error");
    }
}

export async function POST(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const data = await retryNotificationDelivery(
            workspaceId,
            await id(params)
        );
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Retry Notification Delivery Error");
    }
}
