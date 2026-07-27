import { z } from "zod";

export const revokeCredentialSchema = z
    .object({
        reason: z.string().trim().max(500).optional(),
    })
    .strip();

export const validateCredentialQuerySchema = z.object({
    token: z.string().trim().min(16).max(256),
});

export const createCredentialSchema = z
    .object({
        expiresAt: z.coerce.date().nullable().optional(),
    })
    .strip();
