export const FeedbackStatus = {
    NEW: "NEW",
    ACKNOWLEDGED: "ACKNOWLEDGED",
    RESOLVED: "RESOLVED",
} as const;

export type FeedbackStatusValue =
    (typeof FeedbackStatus)[keyof typeof FeedbackStatus];

export const FEEDBACK_STATUS_VALUES = Object.values(FeedbackStatus);

export const FeedbackRoutingResult = {
    GOOGLE_REVIEW: "google_review",
    PRIVATE_FEEDBACK: "private_feedback",
} as const;

export type FeedbackRoutingResultValue =
    (typeof FeedbackRoutingResult)[keyof typeof FeedbackRoutingResult];

export const FEEDBACK_ROUTING_VALUES = Object.values(FeedbackRoutingResult);
