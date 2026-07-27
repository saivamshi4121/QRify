import dbConnect from "@/config/dbConnect";
import WebhookDelivery from "@/models/WebhookDelivery";
import { WebhookDeliveryStatus } from "@/modules/webhooks/constants";
import { deliverWebhook } from "@/modules/webhooks/deliveryRunner";
import { logger } from "@/lib/logger";

/**
 * Pick due RETRYING deliveries and process them asynchronously.
 * Safe to call frequently (opportunistic + cron).
 */
export async function processDueRetries(limit = 25): Promise<number> {
    try {
        await dbConnect();
        const due = await WebhookDelivery.find({
            status: WebhookDeliveryStatus.RETRYING,
            nextRetryAt: { $lte: new Date() },
        })
            .sort({ nextRetryAt: 1 })
            .limit(limit)
            .select("_id")
            .lean();

        for (const row of due) {
            // Mark nextRetryAt forward briefly to reduce double-pickup
            await WebhookDelivery.updateOne(
                { _id: row._id, status: WebhookDeliveryStatus.RETRYING },
                {
                    $set: {
                        nextRetryAt: new Date(Date.now() + 30_000),
                    },
                }
            );
            void deliverWebhook(String(row._id)).catch((err) => {
                logger.error("Webhook retry failed", err);
            });
        }
        return due.length;
    } catch (error) {
        logger.error("processDueRetries failed", error);
        return 0;
    }
}
