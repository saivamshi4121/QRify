import dbConnect from "@/config/dbConnect";
import NotificationDelivery from "@/models/NotificationDelivery";
import { NotificationDeliveryStatus } from "@/modules/notifications/constants";
import { deliverNotification } from "@/modules/notifications/deliveryRunner";
import { logger } from "@/lib/logger";

export async function processDueNotificationRetries(
    limit = 25
): Promise<number> {
    try {
        await dbConnect();
        const due = await NotificationDelivery.find({
            status: NotificationDeliveryStatus.RETRYING,
            nextRetryAt: { $lte: new Date() },
        })
            .sort({ nextRetryAt: 1 })
            .limit(limit)
            .select("_id")
            .lean();

        for (const row of due) {
            await NotificationDelivery.updateOne(
                {
                    _id: row._id,
                    status: NotificationDeliveryStatus.RETRYING,
                },
                { $set: { nextRetryAt: new Date(Date.now() + 30_000) } }
            );
            void deliverNotification(String(row._id)).catch((err) => {
                logger.error("Notification retry failed", err);
            });
        }
        return due.length;
    } catch (error) {
        logger.error("processDueNotificationRetries failed", error);
        return 0;
    }
}
