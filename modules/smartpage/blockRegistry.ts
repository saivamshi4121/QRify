import { z } from "zod";
import { BLOCK_TYPES, BlockType } from "@/modules/smartpage/constants";

const headerConfigSchema = z
    .object({
        logoUrl: z.string().url().optional().or(z.literal("")),
        title: z.string().default("Welcome"),
        subtitle: z.string().optional().default(""),
        headerStyle: z.enum(["centered", "left"]).default("centered"),
    })
    .strip();

const textConfigSchema = z
    .object({
        body: z.string().default(""),
        align: z.enum(["left", "center", "right"]).default("left"),
    })
    .strip();

const ratingConfigSchema = z
    .object({
        questionPrompt: z.string().default("How was your experience today?"),
        starCount: z.number().int().min(1).max(5).default(5),
        negativeThreshold: z.number().int().min(1).max(5).default(4),
        accentColor: z.string().default("#f59e0b"),
    })
    .strip();

const googleReviewConfigSchema = z
    .object({
        buttonText: z.string().default("Leave a Google Review"),
        customReviewUrl: z.string().url().optional().or(z.literal("")),
        googlePlaceId: z.string().optional().default(""),
    })
    .strip();

const feedbackFormConfigSchema = z
    .object({
        placeholder: z.string().default("Tell us what we can improve…"),
        categories: z.array(z.string()).default(["Food", "Service", "Ambience"]),
        requirePhone: z.boolean().default(false),
    })
    .strip();

export type BlockDefinition = {
    type: BlockType;
    displayName: string;
    defaultConfig: Record<string, unknown>;
    configSchema: z.ZodType<Record<string, unknown>>;
};

const definitions: Record<BlockType, BlockDefinition> = {
    header: {
        type: "header",
        displayName: "Header",
        defaultConfig: headerConfigSchema.parse({}),
        configSchema: headerConfigSchema as z.ZodType<Record<string, unknown>>,
    },
    text: {
        type: "text",
        displayName: "Text",
        defaultConfig: textConfigSchema.parse({}),
        configSchema: textConfigSchema as z.ZodType<Record<string, unknown>>,
    },
    rating: {
        type: "rating",
        displayName: "Star Rating",
        defaultConfig: ratingConfigSchema.parse({}),
        configSchema: ratingConfigSchema as z.ZodType<Record<string, unknown>>,
    },
    google_review: {
        type: "google_review",
        displayName: "Google Review",
        defaultConfig: googleReviewConfigSchema.parse({}),
        configSchema: googleReviewConfigSchema as z.ZodType<Record<string, unknown>>,
    },
    feedback_form: {
        type: "feedback_form",
        displayName: "Feedback Form",
        defaultConfig: feedbackFormConfigSchema.parse({}),
        configSchema: feedbackFormConfigSchema as z.ZodType<Record<string, unknown>>,
    },
};

/** Metadata-only registry: types, defaults, Zod schemas. No React components. */
export const blockRegistry = {
    types: BLOCK_TYPES,

    get(type: BlockType): BlockDefinition {
        return definitions[type];
    },

    isRegistered(type: string): type is BlockType {
        return (BLOCK_TYPES as readonly string[]).includes(type);
    },

    validateConfig(type: BlockType, config: unknown): Record<string, unknown> {
        const def = definitions[type];
        return def.configSchema.parse(config ?? {});
    },

    list(): BlockDefinition[] {
        return BLOCK_TYPES.map((t) => definitions[t]);
    },
};
