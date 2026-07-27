import crypto from "crypto";
import dbConnect from "@/config/dbConnect";
import WebhookEndpoint from "@/models/WebhookEndpoint";
import WebhookDelivery from "@/models/WebhookDelivery";
import { logger } from "@/lib/logger";
import {
    WebhookDeliveryStatus,
    type WebhookEventTypeValue,
} from "@/modules/webhooks/constants";
import { generateDeliveryPublicId } from "@/modules/webhooks/signing";
import type { WebhookEnvelope } from "@/modules/webhooks/types";
import { deliverWebhook } from "@/modules/webhooks/deliveryRunner";
import { processDueRetries } from "@/modules/webhooks/retry";

/**
 * Domain event publisher. Business services call this only.
 * Fans out to webhooks + notifications asynchronously.
 * Never performs outbound delivery synchronously.
 */
export async function publishDomainEvent(input: {
    workspaceId: string;
    type: WebhookEventTypeValue;
    data: Record<string, unknown>;
}): Promise<{ queued: number }> {
    try {
        await dbConnect();

        // Notification fan-out (non-blocking side path)
        void import("@/modules/notifications")
            .then((m) =>
                m.enqueueNotificationsForEvent({
                    workspaceId: input.workspaceId,
                    type: input.type,
                    data: input.data,
                })
            )
            .catch((err) => {
                logger.error("Notification fan-out failed", err);
            });

        const endpoints = await WebhookEndpoint.find({
            workspaceId: input.workspaceId,
            enabled: true,
            eventTypes: input.type,
        })
            .select("_id")
            .lean();

        if (endpoints.length === 0) {
            void processDueRetries().catch(() => undefined);
            return { queued: 0 };
        }

        const deliveryIds: string[] = [];

        for (const endpoint of endpoints) {
            const publicId = await uniqueDeliveryId();
            const envelope: WebhookEnvelope = {
                id: publicId,
                type: input.type,
                createdAt: new Date().toISOString(),
                workspaceId: input.workspaceId,
                data: input.data,
            };

            const doc = await WebhookDelivery.create({
                publicId,
                webhookId: endpoint._id,
                workspaceId: input.workspaceId,
                eventType: input.type,
                payload: envelope,
                status: WebhookDeliveryStatus.PENDING,
                attempt: 0,
            });
            deliveryIds.push(doc._id.toString());
        }

        for (const id of deliveryIds) {
            void deliverWebhook(id).catch((err) => {
                logger.error("Webhook delivery enqueue failed", err);
            });
        }

        void processDueRetries().catch(() => undefined);

        return { queued: deliveryIds.length };
    } catch (error) {
        logger.error("publishDomainEvent failed", error);
        return { queued: 0 };
    }
}

async function uniqueDeliveryId(): Promise<string> {
    for (let i = 0; i < 8; i++) {
        const publicId = generateDeliveryPublicId();
        const exists = await WebhookDelivery.findOne({ publicId })
            .select("_id")
            .lean();
        if (!exists) return publicId;
    }
    return `whd_${crypto.randomBytes(8).toString("hex")}`;
}
