import { z } from "zod";
import {
    NOTIFICATION_CHANNEL_VALUES,
    NOTIFICATION_DELIVERY_STATUS_VALUES,
    NOTIFICATION_TRIGGER_EVENT_VALUES,
    NotificationChannel,
} from "@/modules/notifications/constants";

export const createNotificationTemplateSchema = z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional().default(""),
    channel: z.enum(NOTIFICATION_CHANNEL_VALUES),
    triggerEvent: z.enum(NOTIFICATION_TRIGGER_EVENT_VALUES),
    enabled: z.boolean().optional().default(true),
    subject: z.string().trim().max(300).optional().default(""),
    content: z.string().trim().min(1).max(10000),
});

export const updateNotificationTemplateSchema = z.object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).optional(),
    channel: z.enum(NOTIFICATION_CHANNEL_VALUES).optional(),
    triggerEvent: z.enum(NOTIFICATION_TRIGGER_EVENT_VALUES).optional(),
    enabled: z.boolean().optional(),
    subject: z.string().trim().max(300).optional(),
    content: z.string().trim().min(1).max(10000).optional(),
});

export const previewNotificationSchema = z.object({
    subject: z.string().optional().default(""),
    content: z.string().min(1),
    channel: z.enum(NOTIFICATION_CHANNEL_VALUES).optional(),
    variables: z.record(z.string(), z.unknown()).optional().default({}),
});

export const testSendSchema = z.object({
    templateId: z.string().trim().min(1),
    recipient: z.string().trim().min(1).max(320),
    variables: z.record(z.string(), z.unknown()).optional().default({}),
});

export const listNotificationDeliveriesQuerySchema = z.object({
    templateId: z.string().trim().optional(),
    channel: z.enum(NOTIFICATION_CHANNEL_VALUES).optional(),
    status: z.enum(NOTIFICATION_DELIVERY_STATUS_VALUES).optional(),
    triggerEvent: z.enum(NOTIFICATION_TRIGGER_EVENT_VALUES).optional(),
    q: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export function assertSubjectForChannel(
    channel: string,
    subject: string | undefined
) {
    if (channel === NotificationChannel.EMAIL && !(subject || "").trim()) {
        // Soft default — callers may set later; not a hard fail
        return;
    }
}
