export const BLOCK_TYPES = [
    "header",
    "text",
    "rating",
    "google_review",
    "feedback_form",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];
