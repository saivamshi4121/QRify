import dbConnect from "@/config/dbConnect";
import WebhookEndpoint from "@/models/WebhookEndpoint";
import WebhookDelivery from "@/models/WebhookDelivery";
import {
    WebhookDeliveryStatus,
    WEBHOOK_USER_AGENT,
} from "@/modules/webhooks/constants";
import { signWebhookPayload } from "@/modules/webhooks/signing";

/**
 * Execute one delivery attempt (initial or retry).
 */
export async function deliverWebhook(deliveryId: string): Promise<void> {
    await dbConnect();

    const delivery = await WebhookDelivery.findById(deliveryId);
    if (!delivery) return;
    if (
        delivery.status === WebhookDeliveryStatus.DELIVERED ||
        delivery.status === WebhookDeliveryStatus.CANCELLED
    ) {
        return;
    }

    const endpoint = await WebhookEndpoint.findById(delivery.webhookId).select(
        "+secret name url timeoutMs retryPolicy enabled"
    );
    if (!endpoint || !endpoint.enabled) {
        delivery.status = WebhookDeliveryStatus.CANCELLED;
        delivery.errorMessage = "Endpoint missing or disabled";
        delivery.nextRetryAt = null;
        await delivery.save();
        return;
    }

    delivery.status = WebhookDeliveryStatus.PROCESSING;
    delivery.attempt += 1;
    await delivery.save();

    const rawBody = JSON.stringify(delivery.payload);
    const timestampUnix = Math.floor(Date.now() / 1000);
    const signature = signWebhookPayload(
        endpoint.secret,
        timestampUnix,
        rawBody
    );

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": WEBHOOK_USER_AGENT,
        "X-Qrezo-Event": delivery.eventType,
        "X-Qrezo-Delivery": delivery.publicId,
        "X-Qrezo-Timestamp": String(timestampUnix),
        "X-Qrezo-Signature": signature,
    };

    delivery.requestHeaders = {
        "User-Agent": WEBHOOK_USER_AGENT,
        "X-Qrezo-Event": delivery.eventType,
        "X-Qrezo-Delivery": delivery.publicId,
        "X-Qrezo-Timestamp": String(timestampUnix),
        "X-Qrezo-Signature": "t=…,v1=…",
    };

    const started = Date.now();
    let responseCode: number | null = null;
    let responseBody: string | null = null;
    let errorMessage: string | null = null;
    let ok = false;

    try {
        const controller = new AbortController();
        const timer = setTimeout(
            () => controller.abort(),
            endpoint.timeoutMs || 10_000
        );
        const res = await fetch(endpoint.url, {
            method: "POST",
            headers,
            body: rawBody,
            signal: controller.signal,
        });
        clearTimeout(timer);
        responseCode = res.status;
        const text = await res.text();
        responseBody = text.slice(0, 4000);
        ok = res.status >= 200 && res.status < 300;
        if (!ok) {
            errorMessage = `HTTP ${res.status}`;
        }
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Delivery request failed";
        if (message.includes("abort") || message.includes("AbortError")) {
            errorMessage = "Timeout";
        } else if (/ENOTFOUND|getaddrinfo/i.test(message)) {
            errorMessage = `DNS: ${message}`;
        } else if (/CERT|TLS|SSL/i.test(message)) {
            errorMessage = `TLS: ${message}`;
        } else if (/ECONNREFUSED/i.test(message)) {
            errorMessage = `Connection refused: ${message}`;
        } else {
            errorMessage = message.slice(0, 1000);
        }
    }

    const durationMs = Date.now() - started;
    delivery.durationMs = durationMs;
    delivery.responseCode = responseCode;
    delivery.responseBody = responseBody;
    delivery.errorMessage = errorMessage;

    if (ok) {
        delivery.status = WebhookDeliveryStatus.DELIVERED;
        delivery.deliveredAt = new Date();
        delivery.nextRetryAt = null;
        await delivery.save();
        return;
    }

    const maxAttempts = endpoint.retryPolicy?.maxAttempts ?? 6;
    const schedule = endpoint.retryPolicy?.scheduleSeconds ?? [
        60, 300, 900, 3600, 21600,
    ];

    if (delivery.attempt >= maxAttempts) {
        delivery.status = WebhookDeliveryStatus.FAILED;
        delivery.nextRetryAt = null;
        await delivery.save();
        return;
    }

    const delayIdx = Math.min(delivery.attempt - 1, schedule.length - 1);
    const delaySec = schedule[delayIdx] ?? schedule[schedule.length - 1];
    delivery.status = WebhookDeliveryStatus.RETRYING;
    delivery.nextRetryAt = new Date(Date.now() + delaySec * 1000);
    await delivery.save();
}
