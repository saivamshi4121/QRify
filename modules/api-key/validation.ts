import { z } from "zod";
import {
    API_KEY_ENVIRONMENT_VALUES,
    API_KEY_SCOPE_VALUES,
    ApiKeyEnvironment,
    DEFAULT_API_KEY_SCOPES,
} from "@/modules/api-key/constants";

export const createApiKeySchema = z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional().default(""),
    environment: z
        .enum(API_KEY_ENVIRONMENT_VALUES)
        .optional()
        .default(ApiKeyEnvironment.TEST),
    permissions: z
        .array(z.enum(API_KEY_SCOPE_VALUES))
        .min(1)
        .optional()
        .default([...DEFAULT_API_KEY_SCOPES]),
    expiresAt: z.coerce.date().nullable().optional(),
});

export const updateApiKeySchema = z.object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).optional(),
    permissions: z.array(z.enum(API_KEY_SCOPE_VALUES)).min(1).optional(),
    expiresAt: z.coerce.date().nullable().optional(),
});
