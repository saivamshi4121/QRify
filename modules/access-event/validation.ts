import { z } from "zod";
import {
    ACCESS_RESULT_VALUES,
    ACCESS_TYPE_VALUES,
    AccessType,
    ACCESS_PAGE_SIZE_DEFAULT,
    ACCESS_PAGE_SIZE_MAX,
} from "@/modules/access-event/constants";

export const validateAccessSchema = z
    .object({
        token: z.string().trim().min(16).max(256),
        type: z.enum(ACCESS_TYPE_VALUES).optional().default(AccessType.ENTRY),
        gate: z.string().trim().max(120).optional().default("Main"),
        deviceId: z.string().trim().max(120).nullable().optional(),
        notes: z.string().trim().max(1000).optional().default(""),
        /** When set, credential must belong to this event (mongo event id from route). */
        eventId: z.string().optional(),
    })
    .strip();

export const manualAccessSchema = z
    .object({
        gate: z.string().trim().max(120).optional().default("Manual"),
        notes: z.string().trim().max(1000).optional().default(""),
        deviceId: z.string().trim().max(120).nullable().optional(),
    })
    .strip();

export const listAccessEventsQuerySchema = z.object({
    q: z.string().trim().optional(),
    gate: z.string().trim().optional(),
    result: z.enum(ACCESS_RESULT_VALUES).optional(),
    type: z.enum(ACCESS_TYPE_VALUES).optional(),
    attendeePublicId: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(ACCESS_PAGE_SIZE_MAX)
        .optional()
        .default(ACCESS_PAGE_SIZE_DEFAULT),
});
