import { z } from "zod";
import {
    REGISTRATION_SOURCE_VALUES,
    REGISTRATION_STATUS_VALUES,
    RegistrationSource,
    RegistrationStatus,
    ATTENDEE_PAGE_SIZE_DEFAULT,
    ATTENDEE_PAGE_SIZE_MAX,
} from "@/modules/attendee/constants";

const phoneSchema = z
    .string()
    .trim()
    .max(40)
    .regex(/^[+0-9()\-\s]*$/, "Invalid phone number")
    .optional()
    .or(z.literal(""));

export const createAttendeeSchema = z
    .object({
        firstName: z.string().trim().min(1, "First name is required").max(80),
        lastName: z.string().trim().min(1, "Last name is required").max(80),
        email: z.string().trim().email("Valid email is required").max(254),
        phone: phoneSchema,
        company: z.string().trim().max(160).optional().default(""),
        designation: z.string().trim().max(120).optional().default(""),
        ticketType: z
            .string()
            .trim()
            .min(1, "Ticket type is required")
            .max(80)
            .default("General"),
        registrationSource: z
            .enum(REGISTRATION_SOURCE_VALUES)
            .optional()
            .default(RegistrationSource.MANUAL),
        registrationStatus: z
            .enum(REGISTRATION_STATUS_VALUES)
            .optional()
            .default(RegistrationStatus.REGISTERED),
        notes: z.string().trim().max(2000).optional().default(""),
        externalId: z.string().trim().max(120).nullable().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .strip();

export const updateAttendeeSchema = z
    .object({
        firstName: z.string().trim().min(1).max(80).optional(),
        lastName: z.string().trim().min(1).max(80).optional(),
        email: z.string().trim().email().max(254).optional(),
        phone: phoneSchema,
        company: z.string().trim().max(160).optional(),
        designation: z.string().trim().max(120).optional(),
        ticketType: z.string().trim().min(1).max(80).optional(),
        registrationSource: z.enum(REGISTRATION_SOURCE_VALUES).optional(),
        registrationStatus: z.enum(REGISTRATION_STATUS_VALUES).optional(),
        notes: z.string().trim().max(2000).optional(),
        externalId: z.string().trim().max(120).nullable().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .strip();

export const listAttendeesQuerySchema = z.object({
    q: z.string().trim().optional(),
    status: z.enum(REGISTRATION_STATUS_VALUES).optional(),
    source: z.enum(REGISTRATION_SOURCE_VALUES).optional(),
    ticketType: z.string().trim().optional(),
    sort: z
        .enum([
            "createdAt_desc",
            "createdAt_asc",
            "name_asc",
            "name_desc",
            "email_asc",
        ])
        .optional()
        .default("createdAt_desc"),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(ATTENDEE_PAGE_SIZE_MAX)
        .optional()
        .default(ATTENDEE_PAGE_SIZE_DEFAULT),
});

export const bulkDeleteAttendeesSchema = z.object({
    publicIds: z
        .array(z.string().regex(/^att_[a-z0-9]+$/i))
        .min(1)
        .max(200),
});

/** Column mapping from CSV headers → attendee fields */
export const csvColumnMapSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    /** Full name column; split on first space if first/last not mapped */
    name: z.string().optional(),
    email: z.string().min(1, "Email column is required"),
    phone: z.string().optional(),
    company: z.string().optional(),
    designation: z.string().optional(),
    ticketType: z.string().optional(),
});

export const bulkImportPreviewSchema = z.object({
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string())).min(1).max(2000),
    columnMap: csvColumnMapSchema,
});

export const bulkImportSchema = bulkImportPreviewSchema;

export type CreateAttendeeInput = z.infer<typeof createAttendeeSchema>;
export type UpdateAttendeeInput = z.infer<typeof updateAttendeeSchema>;
export type ListAttendeesQuery = z.infer<typeof listAttendeesQuerySchema>;
export type CsvColumnMap = z.infer<typeof csvColumnMapSchema>;
