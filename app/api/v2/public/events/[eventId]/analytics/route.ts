import { NextRequest } from "next/server";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
import {
    getAccessAnalytics,
    getAttendanceAnalytics,
    getCredentialAnalytics,
    getEventAnalyticsOverview,
} from "@/modules/event-analytics/service";

type RouteParams = {
    params: Promise<{ eventId: string }> | { eventId: string };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.ANALYTICS_READ, async (ctx) => {
        const resolved = params instanceof Promise ? await params : params;
        const eventId = resolved.eventId;
        const section =
            new URL(request.url).searchParams.get("section") || "overview";

        if (section === "attendance") {
            return publicOk(
                await getAttendanceAnalytics(ctx.workspaceId, eventId)
            );
        }
        if (section === "access") {
            return publicOk(
                await getAccessAnalytics(ctx.workspaceId, eventId)
            );
        }
        if (section === "credentials") {
            return publicOk(
                await getCredentialAnalytics(ctx.workspaceId, eventId)
            );
        }

        return publicOk(
            await getEventAnalyticsOverview(ctx.workspaceId, eventId)
        );
    });
}
