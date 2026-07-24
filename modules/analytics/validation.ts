import { z } from "zod";

export const analyticsRangeSchema = z.enum(["today", "7d", "30d", "custom"]);

export const analyticsOverviewQuerySchema = z
    .object({
        range: analyticsRangeSchema.default("7d"),
        from: z.string().min(1).optional(),
        to: z.string().min(1).optional(),
    })
    .superRefine((val, ctx) => {
        if (val.range === "custom" && (!val.from || !val.to)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Custom range requires from and to dates",
            });
        }
    });

export type AnalyticsRangePreset = z.infer<typeof analyticsRangeSchema>;
