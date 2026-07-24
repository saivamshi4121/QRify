import { BlockType } from "@/modules/smartpage/constants";

/** User-facing labels — blocks stay internal. */
export const REVIEW_SECTION_LABELS: Record<BlockType, string> = {
    header: "Restaurant Information",
    text: "Extra Text",
    rating: "Star Rating",
    google_review: "Google Review Link",
    feedback_form: "Private Feedback",
};

export const DEFAULT_REVIEW_BLOCK_TYPES: BlockType[] = [
    "header",
    "rating",
    "google_review",
    "feedback_form",
];
