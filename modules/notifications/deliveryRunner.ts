import crypto from "crypto";
import dbConnect from "@/config/dbConnect";
import NotificationDelivery from "@/models/NotificationDelivery";
import NotificationTemplate from "@/models/NotificationTemplate";
import { logger } from "@/lib/logger";
import {
    DEFAULT_NOTIFICATION_MAX_ATTEMPTS,
    DEFAULT_NOTIFICATION_RETRY_SCHEDULE_SECONDS,
    NotificationChannel,
    NotificationDeliveryStatus,
    NOTIFICATION_TRIGGER_EVENT_VALUES,
    type NotificationTriggerEventValue,
} from "@/modules/notifications/constants";
import {
    buildVariableMap,
    renderTemplate,
} from "@/modules/notifications/templateEngine";
import { resolveProviderForChannel } from "@/modules/notifications/providers";
import { enrichNotificationData } from "@/modules/notifications/enrich";

function generateDeliveryPublicId() {
    return `ndel_${crypto.randomBytes(6).toString("hex")}`;
}

async function uniqueDeliveryPublicId(): Promise<string> {
    for (let i = 0; i < 8; i++) {
        const publicId = generateDeliveryPublicId();
        const exists = await NotificationDelivery.findOne({ publicId })
            .select("_id")
            .lean();
        if (!exists) return publicId;
    }
    return `ndel_${crypto.randomBytes(8).toString("hex")}`;
}

function isNotificationTrigger(
    type: string
): type is NotificationTriggerEventValue {
    return (NOTIFICATION_TRIGGER_EVENT_VALUES as string[]).includes(type);
}

function resolveRecipient(
    channel: string,
    vars: Record<string, string>,
    data: Record<string, unknown>
): string | null {
    if (channel === NotificationChannel.EMAIL) {
        return vars.email || (typeof data.email === "string" ? data.email : null);
    }
    if (
        channel === NotificationChannel.SMS ||
        channel === NotificationChannel.WHATSAPP
    ) {
        return (
            vars.phone ||
            (typeof data.phone === "string" ? data.phone : null) ||
            null
        );
    }
    return null;
}

function resolveAttendeeId(data: Record<string, unknown>): string | null {
    const id =
        data.id ||
        data.publicId ||
        data.attendeeId ||
        (data.attendee as Record<string, unknown> | undefined)?.id ||
        (data.attendee as Record<string, unknown> | undefined)?.publicId;
    return id ? String(id) : null;
}

/**
 * Domain-event consumer for notifications.
 * Finds matching templates, persists deliveries, queues background send.
 */
export async function enqueueNotificationsForEvent(input: {
    workspaceId: string;
    type: string;
    data: Record<string, unknown>;
}): Promise<{ queued: number }> {
    try {
        if (!isNotificationTrigger(input.type)) {
            void import("@/modules/notifications/retry")
                .then((m) => m.processDueNotificationRetries())
                .catch(() => undefined);
            return { queued: 0 };
        }

        await dbConnect();
        const templates = await NotificationTemplate.find({
            workspaceId: input.workspaceId,
            enabled: true,
            triggerEvent: input.type,
        }).lean();

        if (templates.length === 0) {
            void import("@/modules/notifications/retry")
                .then((m) => m.processDueNotificationRetries())
                .catch(() => undefined);
            return { queued: 0 };
        }

        const enriched = await enrichNotificationData(
            input.workspaceId,
            input.data
        );
        const vars = buildVariableMap(enriched);
        const escapeHtml = false; // plain text templates by default
        const deliveryIds: string[] = [];

        for (const tpl of templates) {
            const recipient = resolveRecipient(tpl.channel, vars, enriched);
            if (!recipient) {
                logger.info(
                    "Skipping notification — no recipient for channel",
                    { template: tpl.publicId, channel: tpl.channel }
                );
                continue;
            }

            const subject = renderTemplate(tpl.subject || "", vars, {
                escape: escapeHtml,
            });
            const renderedContent = renderTemplate(tpl.content, vars, {
                escape: escapeHtml,
            });

            const publicId = await uniqueDeliveryPublicId();
            const doc = await NotificationDelivery.create({
                publicId,
                workspaceId: input.workspaceId,
                templateId: tpl._id,
                attendeeId: resolveAttendeeId(enriched),
                channel: tpl.channel,
                provider: "console",
                triggerEvent: input.type,
                status: NotificationDeliveryStatus.PENDING,
                recipient,
                subject,
                renderedContent,
                attempts: 0,
            });
            deliveryIds.push(doc._id.toString());
        }

        for (const id of deliveryIds) {
            void deliverNotification(id).catch((err) => {
                logger.error("Notification delivery enqueue failed", err);
            });
        }

        void import("@/modules/notifications/retry")
            .then((m) => m.processDueNotificationRetries())
            .catch(() => undefined);
        return { queued: deliveryIds.length };
    } catch (error) {
        logger.error("enqueueNotificationsForEvent failed", error);
        return { queued: 0 };
    }
}

export async function deliverNotification(deliveryId: string): Promise<void> {
    await dbConnect();
    const delivery = await NotificationDelivery.findById(deliveryId);
    if (!delivery) return;
    if (
        delivery.status === NotificationDeliveryStatus.DELIVERED ||
        delivery.status === NotificationDeliveryStatus.CANCELLED
    ) {
        return;
    }

    const template = await NotificationTemplate.findById(delivery.templateId);
    if (!template || !template.enabled) {
        // Allow test sends even if template later disabled — only cancel if missing
        if (!template) {
            delivery.status = NotificationDeliveryStatus.CANCELLED;
            delivery.error = "Template missing";
            delivery.nextRetryAt = null;
            await delivery.save();
            return;
        }
    }

    delivery.status = NotificationDeliveryStatus.PROCESSING;
    delivery.attempts += 1;
    await delivery.save();

    const started = Date.now();
    try {
        const provider = resolveProviderForChannel(delivery.channel);
        delivery.provider = provider.id;
        const result = await provider.send({
            channel: delivery.channel,
            recipient: delivery.recipient,
            subject: delivery.subject,
            content: delivery.renderedContent,
            metadata: {
                deliveryId: delivery.publicId,
                triggerEvent: delivery.triggerEvent,
            },
        });

        delivery.durationMs = Date.now() - started;

        if (result.success) {
            delivery.status = NotificationDeliveryStatus.DELIVERED;
            delivery.providerMessageId = result.providerMessageId || null;
            delivery.deliveredAt = new Date();
            delivery.error = null;
            delivery.nextRetryAt = null;
            await delivery.save();
            return;
        }

        delivery.error = (result.error || "Provider send failed").slice(0, 1000);
        await scheduleRetryOrFail(delivery);
    } catch (err) {
        delivery.durationMs = Date.now() - started;
        delivery.error = (
            err instanceof Error ? err.message : "Delivery failed"
        ).slice(0, 1000);
        await scheduleRetryOrFail(delivery);
    }
}

async function scheduleRetryOrFail(
    delivery: InstanceType<typeof NotificationDelivery>
) {
    const maxAttempts = DEFAULT_NOTIFICATION_MAX_ATTEMPTS;
    const schedule = [...DEFAULT_NOTIFICATION_RETRY_SCHEDULE_SECONDS];

    if (delivery.attempts >= maxAttempts) {
        delivery.status = NotificationDeliveryStatus.FAILED;
        delivery.nextRetryAt = null;
        await delivery.save();
        return;
    }

    const delayIdx = Math.min(delivery.attempts - 1, schedule.length - 1);
    const delaySec = schedule[delayIdx] ?? schedule[schedule.length - 1];
    delivery.status = NotificationDeliveryStatus.RETRYING;
    delivery.nextRetryAt = new Date(Date.now() + delaySec * 1000);
    await delivery.save();
}
