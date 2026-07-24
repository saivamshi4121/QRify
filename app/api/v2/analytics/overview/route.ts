import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { analyticsOverviewQuerySchema } from "@/modules/analytics/validation";
import { getAnalyticsOverview } from "@/modules/analytics/service";

export async function GET(request: NextRequest) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const url = new URL(request.url);
        const parsed = analyticsOverviewQuerySchema.parse({
            range: url.searchParams.get("range") || "7d",
            from: url.searchParams.get("from") || undefined,
            to: url.searchParams.get("to") || undefined,
        });

        const data = await getAnalyticsOverview(
            workspaceId,
            parsed.range,
            parsed.from,
            parsed.to
        );

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Analytics Overview Error");
    }
}
