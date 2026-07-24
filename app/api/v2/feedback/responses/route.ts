import { NextRequest, NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { listFeedback } from "@/modules/feedback/service";
import {
    FEEDBACK_STATUS_VALUES,
    FeedbackStatusValue,
} from "@/modules/feedback/constants";

export async function GET(request: NextRequest) {
    try {
        const { workspaceId } = await resolveWorkspace();
        const { searchParams } = new URL(request.url);
        const statusParam = searchParams.get("status");
        const smartPageId = searchParams.get("smartPageId") || undefined;

        let status: FeedbackStatusValue | undefined;
        if (
            statusParam &&
            (FEEDBACK_STATUS_VALUES as string[]).includes(statusParam)
        ) {
            status = statusParam as FeedbackStatusValue;
        }

        const data = await listFeedback(workspaceId, { status, smartPageId });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "List Feedback Error");
    }
}
