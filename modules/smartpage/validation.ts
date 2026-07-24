import { z } from "zod";
import { BLOCK_TYPES } from "@/modules/smartpage/constants";
import { blockRegistry } from "@/modules/smartpage/blockRegistry";

const themeSchema = z
    .object({
        primaryColor: z.string().optional(),
        backgroundColor: z.string().optional(),
        fontFamily: z.string().optional(),
        logoUrl: z.string().url().optional().or(z.literal("")).optional(),
    })
    .strip()
    .optional();

export const createSmartPageSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(120),
    slug: z
        .string()
        .trim()
        .min(1)
        .max(80)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
        .optional(),
    theme: themeSchema,
    isPublished: z.boolean().optional(),
});

export const updateSmartPageSchema = z
    .object({
        title: z.string().trim().min(1).max(120).optional(),
        slug: z
            .string()
            .trim()
            .min(1)
            .max(80)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
            .optional(),
        theme: themeSchema,
        isPublished: z.boolean().optional(),
    })
    .strip();

export const createBlockSchema = z
    .object({
        blockType: z.enum(BLOCK_TYPES),
        sortOrder: z.number().int().optional(),
        title: z.string().trim().optional(),
        config: z.record(z.string(), z.unknown()).optional(),
        isVisible: z.boolean().optional(),
    })
    .strip()
    .superRefine((data, ctx) => {
        try {
            blockRegistry.validateConfig(data.blockType, data.config ?? {});
        } catch (error) {
            if (error instanceof z.ZodError) {
                for (const issue of error.issues) {
                    ctx.addIssue({
                        code: "custom",
                        message: issue.message,
                        path: ["config", ...issue.path],
                    });
                }
            } else {
                ctx.addIssue({
                    code: "custom",
                    message: "Invalid block config",
                    path: ["config"],
                });
            }
        }
    });

export const updateBlockSchema = z
    .object({
        blockType: z.enum(BLOCK_TYPES).optional(),
        sortOrder: z.number().int().optional(),
        title: z.string().trim().optional(),
        config: z.record(z.string(), z.unknown()).optional(),
        isVisible: z.boolean().optional(),
    })
    .strip();
