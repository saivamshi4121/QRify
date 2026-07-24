import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().trim().min(1, "Missing required fields"),
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const generateQRSchema = z.object({
    qrName: z.string().trim().min(1, "Missing required fields"),
    qrType: z.string().trim().min(1, "Missing required fields"),
    originalData: z.string().trim().min(1, "Missing required fields"),
    foregroundColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    logoUrl: z.union([z.string(), z.null()]).optional(),
    smartPageId: z.string().optional().nullable(),
});

export const previewQRSchema = z.object({
    originalData: z.string().trim().min(1, "Data is required"),
    foregroundColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    logoUrl: z.union([z.string(), z.null()]).optional(),
});

export const updateLinkSchema = z
    .object({
        newOriginalData: z.string().trim().min(1).optional(),
        smartPageId: z.string().nullable().optional(),
    })
    .refine(
        (data) =>
            data.newOriginalData !== undefined ||
            data.smartPageId !== undefined,
        { message: "Provide newOriginalData and/or smartPageId" }
    );

export const updateProfileSchema = z.object({
    name: z.string().trim().min(1, "Name and email are required"),
    email: z.string().trim().email("Invalid email address"),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password and new password are required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const checkoutPlanSchema = z.object({
    plan: z.enum(["pro", "business"], {
        error: "Invalid plan selected",
    }),
});

export const adminUpdateUserSchema = z
    .object({
        userId: z.string().min(1, "User ID is required"),
        role: z.enum(["user", "admin"]).optional(),
        subscriptionPlan: z.enum(["free", "pro", "business"]).optional(),
    })
    .strict();
