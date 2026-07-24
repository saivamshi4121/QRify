import { NextResponse } from "next/server";
import { reviewClickedSchema } from "@/modules/feedback/validation";
import { markReviewClicked } from "@/modules/feedback/service";
import { handleApiError } from "@/core/errors/handleApiError";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { responseId } = reviewClickedSchema.parse(body);
        const data = await markReviewClicked(responseId);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Review Clicked Error");
    }
}
