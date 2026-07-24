import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import FeedbackResponse from "@/models/FeedbackResponse";
import SmartPage from "@/models/SmartPage";
import Block from "@/models/Block";
import {
    FeedbackRoutingResult,
    FeedbackStatus,
    FeedbackStatusValue,
} from "@/modules/feedback/constants";
import {
    BadRequestError,
    NotFoundError,
    ForbiddenError,
} from "@/core/errors/AppError";

function resolveGoogleThreshold(ratingConfig: Record<string, unknown> | undefined): number {
    const raw = ratingConfig?.negativeThreshold;
    const threshold = typeof raw === "number" ? raw : 4;
    return Math.min(Math.max(threshold, 1), 5);
}

export async function submitFeedback(input: {
    smartPageId: string;
    qrCodeId?: string | null;
    ratingScore: number;
    category?: string;
    commentText?: string;
    customerName?: string;
    customerPhone?: string;
    locationTag?: string;
}) {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(input.smartPageId)) {
        throw new BadRequestError("Invalid smartPageId");
    }

    const page = await SmartPage.findOne({
        _id: input.smartPageId,
        isPublished: true,
    }).lean();

    if (!page) {
        throw new NotFoundError("Smart Page not found");
    }

    const ratingBlock = await Block.findOne({
        smartPageId: page._id,
        blockType: "rating",
        isVisible: true,
    })
        .sort({ sortOrder: 1 })
        .lean();

    const threshold = resolveGoogleThreshold(
        (ratingBlock?.config || {}) as Record<string, unknown>
    );

    const isGooglePath = input.ratingScore >= threshold;
    const routingResult = isGooglePath
        ? FeedbackRoutingResult.GOOGLE_REVIEW
        : FeedbackRoutingResult.PRIVATE_FEEDBACK;

    if (!isGooglePath && !input.commentText?.trim() && !input.category) {
        // Private path may still allow empty comment for MVP flexibility
    }

    let qrCodeId: mongoose.Types.ObjectId | undefined;
    if (input.qrCodeId && mongoose.Types.ObjectId.isValid(input.qrCodeId)) {
        qrCodeId = new mongoose.Types.ObjectId(input.qrCodeId);
    }

    const doc = await FeedbackResponse.create({
        workspaceId: page.workspaceId,
        smartPageId: page._id,
        qrCodeId,
        ratingScore: input.ratingScore,
        category: input.category,
        commentText: input.commentText,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        locationTag: input.locationTag,
        status: FeedbackStatus.NEW,
        routingResult,
        reviewClicked: false,
    });

    const googleBlock = await Block.findOne({
        smartPageId: page._id,
        blockType: "google_review",
        isVisible: true,
    })
        .sort({ sortOrder: 1 })
        .lean();

    const googleConfig = (googleBlock?.config || {}) as {
        customReviewUrl?: string;
        googlePlaceId?: string;
        buttonText?: string;
    };

    let googleReviewUrl: string | null = null;
    if (googleConfig.customReviewUrl) {
        googleReviewUrl = googleConfig.customReviewUrl;
    } else if (googleConfig.googlePlaceId) {
        googleReviewUrl = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(googleConfig.googlePlaceId)}`;
    }

    return {
        responseId: doc._id.toString(),
        routingResult,
        threshold,
        googleReviewUrl,
        googleButtonText: googleConfig.buttonText || "Leave a Google Review",
    };
}

export async function listFeedback(
    workspaceId: string,
    filters?: { status?: FeedbackStatusValue; smartPageId?: string }
) {
    await dbConnect();

    const query: Record<string, unknown> = { workspaceId };
    if (filters?.status) query.status = filters.status;
    if (filters?.smartPageId && mongoose.Types.ObjectId.isValid(filters.smartPageId)) {
        query.smartPageId = filters.smartPageId;
    }

    const rows = await FeedbackResponse.find(query)
        .sort({ createdAt: -1 })
        .limit(200)
        .lean();

    const pageIds = [
        ...new Set(rows.map((r) => r.smartPageId.toString())),
    ];
    const pages = await SmartPage.find({ _id: { $in: pageIds } })
        .select("title slug")
        .lean();
    const pageMap = new Map(pages.map((p) => [p._id.toString(), p]));

    return rows.map((row) => {
        const page = pageMap.get(row.smartPageId.toString());
        return {
            ...row,
            smartPageTitle: page?.title || "Unknown page",
            smartPageSlug: page?.slug,
        };
    });
}

export async function updateFeedbackStatus(
    responseId: string,
    workspaceId: string,
    status: FeedbackStatusValue
) {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(responseId)) {
        throw new BadRequestError("Invalid feedback ID");
    }

    const updated = await FeedbackResponse.findOneAndUpdate(
        { _id: responseId, workspaceId },
        { status },
        { new: true }
    ).lean();

    if (!updated) {
        throw new ForbiddenError("Feedback not found in this workspace");
    }

    return updated;
}

export async function markReviewClicked(responseId: string) {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(responseId)) {
        throw new BadRequestError("Invalid responseId");
    }

    const updated = await FeedbackResponse.findOneAndUpdate(
        {
            _id: responseId,
            routingResult: FeedbackRoutingResult.GOOGLE_REVIEW,
        },
        { reviewClicked: true },
        { new: true }
    )
        .select("_id reviewClicked")
        .lean();

    if (!updated) {
        throw new NotFoundError("Feedback response not found");
    }

    return updated;
}
