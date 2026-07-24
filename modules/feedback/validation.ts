import { z } from "zod";
import { FeedbackStatus } from "@/modules/feedback/constants";

export const submitFeedbackSchema = z
    .object({
        smartPageId: z.string().min(1, "smartPageId is required"),
        qrCodeId: z.string().optional().nullable(),
        ratingScore: z.number().int().min(1).max(5),
        category: z.string().trim().optional(),
        commentText: z.string().trim().max(2000).optional(),
        customerName: z.string().trim().optional(),
        customerPhone: z.string().trim().optional(),
        locationTag: z.string().trim().optional(),
    })
    .strip();

export const updateFeedbackStatusSchema = z
    .object({
        status: z.enum([
            FeedbackStatus.NEW,
            FeedbackStatus.ACKNOWLEDGED,
            FeedbackStatus.RESOLVED,
        ]),
    })
    .strip();

export const reviewClickedSchema = z
    .object({
        responseId: z.string().min(1, "responseId is required"),
    })
    .strip();
