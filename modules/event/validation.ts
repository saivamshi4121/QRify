import { z } from "zod";
import { EVENT_STATUS_VALUES, EventStatus } from "@/modules/event/constants";

const optionalUrl = z
    .string()
    .trim()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .optional();

const slugSchema = z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must be lowercase alphanumeric with hyphens"
    );

export const createEventSchema = z
    .object({
        name: z.string().trim().min(1, "Event name is required").max(160),
        slug: slugSchema.optional(),
        description: z.string().trim().max(5000).optional().default(""),
        logo: optionalUrl,
        banner: optionalUrl,
        venue: z.string().trim().max(300).optional().default(""),
        timezone: z.string().trim().min(1, "Timezone is required").max(80),
        startDate: z.coerce.date({ message: "Start date is required" }),
        endDate: z.coerce.date({ message: "End date is required" }),
        status: z.enum(EVENT_STATUS_VALUES).optional().default(EventStatus.DRAFT),
    })
    .superRefine((data, ctx) => {
        if (data.endDate < data.startDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "End date must be on or after start date",
                path: ["endDate"],
            });
        }
        if (
            data.status === EventStatus.COMPLETED ||
            data.status === EventStatus.ARCHIVED
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "New events must be Draft or Published",
                path: ["status"],
            });
        }
    });

export const updateEventSchema = z
    .object({
        name: z.string().trim().min(1).max(160).optional(),
        slug: slugSchema.optional(),
        description: z.string().trim().max(5000).optional(),
        logo: optionalUrl,
        banner: optionalUrl,
        venue: z.string().trim().max(300).optional(),
        timezone: z.string().trim().min(1).max(80).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        status: z.enum(EVENT_STATUS_VALUES).optional(),
    })
    .strip()
    .superRefine((data, ctx) => {
        if (data.startDate && data.endDate && data.endDate < data.startDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "End date must be on or after start date",
                path: ["endDate"],
            });
        }
    });

export const listEventsQuerySchema = z.object({
    q: z.string().trim().optional(),
    status: z.enum(EVENT_STATUS_VALUES).optional(),
    sort: z.enum(["startDate_asc", "startDate_desc", "createdAt_desc"]).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
