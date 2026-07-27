import { z } from "zod";
import {
    DEFAULT_MAX_ATTEMPTS,
    DEFAULT_RETRY_SCHEDULE_SECONDS,
    DEFAULT_TIMEOUT_MS,
    WEBHOOK_EVENT_TYPE_VALUES,
} from "@/modules/webhooks/constants";

const retryPolicySchema = z
    .object({
        maxAttempts: z.number().int().min(1).max(20).optional(),
        scheduleSeconds: z
            .array(z.number().int().min(1).max(86400))
            .min(1)
            .max(10)
            .optional(),
    })
    .optional();

export const createWebhookEndpointSchema = z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional().default(""),
    url: z.string().trim().url().max(2048),
    enabled: z.boolean().optional().default(true),
    eventTypes: z
        .array(z.enum(WEBHOOK_EVENT_TYPE_VALUES))
        .min(1, "Select at least one event type"),
    retryPolicy: retryPolicySchema,
    timeoutMs: z
        .number()
        .int()
        .min(1000)
        .max(60000)
        .optional()
        .default(DEFAULT_TIMEOUT_MS),
});

export const updateWebhookEndpointSchema = z.object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).optional(),
    url: z.string().trim().url().max(2048).optional(),
    enabled: z.boolean().optional(),
    eventTypes: z.array(z.enum(WEBHOOK_EVENT_TYPE_VALUES)).min(1).optional(),
    retryPolicy: retryPolicySchema,
    timeoutMs: z.number().int().min(1000).max(60000).optional(),
});

export const listDeliveriesQuerySchema = z.object({
    webhookId: z.string().trim().optional(),
    eventType: z.enum(WEBHOOK_EVENT_TYPE_VALUES).optional(),
    status: z.string().trim().optional(),
    q: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export function normalizeRetryPolicy(
    input?: {
        maxAttempts?: number;
        scheduleSeconds?: number[];
    } | null
) {
    return {
        maxAttempts: input?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
        scheduleSeconds:
            input?.scheduleSeconds?.length
                ? input.scheduleSeconds
                : [...DEFAULT_RETRY_SCHEDULE_SECONDS],
    };
}
