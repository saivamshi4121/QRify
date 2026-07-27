import { NextRequest } from "next/server";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
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

export async function GET(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.NOTIFICATIONS_READ, async (ctx) => {
        return publicOk(
            await getNotificationDelivery(ctx.workspaceId, await id(params))
        );
    });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    return withApiKey(
        request,
        ApiKeyScope.NOTIFICATIONS_WRITE,
        async (ctx) => {
            return publicOk(
                await retryNotificationDelivery(
                    ctx.workspaceId,
                    await id(params)
                )
            );
        }
    );
}
