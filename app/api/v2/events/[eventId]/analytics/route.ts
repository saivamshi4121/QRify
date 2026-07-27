import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { ForbiddenError } from "@/core/errors/AppError";
import { WorkspaceRole } from "@/models/WorkspaceMember";
import {
    exportAccessLogsCsv,
    exportAttendeesCsv,
    exportCredentialsCsv,
    getAccessAnalytics,
    getAttendanceAnalytics,
    getCredentialAnalytics,
    getEventAnalyticsOverview,
    getGatePerformance,
    getRecentActivity,
    getScannerAnalytics,
    searchEventOps,
} from "@/modules/event-analytics/service";

type RouteParams = {
    params: Promise<{ eventId: string }> | { eventId: string };
};

async function resolveEventId(params: RouteParams["params"]) {
    const resolved = params instanceof Promise ? await params : params;
    return resolved.eventId;
}

/** Scanner operators (devices) have no dashboard session; members+ can view. */
function assertCanViewAnalytics(role: WorkspaceRole) {
    if (!role) {
        throw new ForbiddenError("You do not have access to event analytics");
    }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanViewAnalytics(role);
        const eventId = await resolveEventId(params);
        const url = new URL(request.url);
        const section = url.searchParams.get("section") || "overview";
        const page = Number(url.searchParams.get("page") || "1");
        const q = url.searchParams.get("q") || "";
        const format = url.searchParams.get("format");

        if (format === "csv") {
            const exportType = url.searchParams.get("export") || "attendees";
            let csv = "";
            let filename = "export.csv";
            if (exportType === "access") {
                csv = await exportAccessLogsCsv(workspaceId, eventId);
                filename = `event-${eventId}-access.csv`;
            } else if (exportType === "credentials") {
                csv = await exportCredentialsCsv(workspaceId, eventId);
                filename = `event-${eventId}-credentials.csv`;
            } else {
                csv = await exportAttendeesCsv(workspaceId, eventId);
                filename = `event-${eventId}-attendees.csv`;
            }
            return new NextResponse(csv, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${filename}"`,
                },
            });
        }

        switch (section) {
            case "attendance":
                return NextResponse.json({
                    success: true,
                    data: await getAttendanceAnalytics(workspaceId, eventId),
                });
            case "scanners":
                return NextResponse.json({
                    success: true,
                    data: await getScannerAnalytics(workspaceId, eventId),
                });
            case "gates":
                return NextResponse.json({
                    success: true,
                    data: await getGatePerformance(workspaceId, eventId),
                });
            case "credentials":
                return NextResponse.json({
                    success: true,
                    data: await getCredentialAnalytics(workspaceId, eventId),
                });
            case "access":
                return NextResponse.json({
                    success: true,
                    data: await getAccessAnalytics(workspaceId, eventId),
                });
            case "activity":
                return NextResponse.json({
                    success: true,
                    data: await getRecentActivity(workspaceId, eventId, page),
                });
            case "search":
                return NextResponse.json({
                    success: true,
                    data: await searchEventOps(workspaceId, eventId, q, page),
                });
            case "overview":
            default:
                return NextResponse.json({
                    success: true,
                    data: await getEventAnalyticsOverview(workspaceId, eventId),
                });
        }
    } catch (error) {
        return handleApiError(error, "Event Analytics Error");
    }
}
