import { z } from "zod";

export const createPairingSchema = z.object({
    name: z.string().trim().min(1).max(120).optional().default("Scanner"),
    gate: z.string().trim().max(120).optional().default(""),
});

export const pairScannerSchema = z.object({
    pairingCode: z
        .string()
        .trim()
        .regex(/^\d{6}$/, "Pairing code must be 6 digits"),
    deviceFingerprint: z.string().trim().max(200).optional().nullable(),
    appVersion: z.string().trim().max(40).optional().nullable(),
    deviceName: z.string().trim().max(120).optional().nullable(),
});

export const renameDeviceSchema = z.object({
    name: z.string().trim().min(1).max(120),
});

export const updateDeviceGateSchema = z.object({
    gate: z.string().trim().min(1).max(120),
});

export const staffSessionSchema = z.object({
    eventId: z.string().trim().min(1),
    gate: z.string().trim().min(1).max(120),
    deviceName: z.string().trim().max(120).optional(),
    deviceFingerprint: z.string().trim().max(200).optional().nullable(),
    appVersion: z.string().trim().max(40).optional().nullable(),
});

export const scannerValidateSchema = z.object({
    token: z.string().trim().min(1),
    type: z.enum(["ENTRY", "EXIT", "CHECKPOINT"]).optional().default("ENTRY"),
    gate: z.string().trim().max(120).optional(),
});
