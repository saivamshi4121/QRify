export const WebhookEventType = {
    EVENT_CREATED: "event.created",
    EVENT_UPDATED: "event.updated",
    EVENT_DELETED: "event.deleted",
    ATTENDEE_CREATED: "attendee.created",
    ATTENDEE_UPDATED: "attendee.updated",
    ATTENDEE_DELETED: "attendee.deleted",
    CREDENTIAL_GENERATED: "credential.generated",
    CREDENTIAL_REGENERATED: "credential.regenerated",
    CREDENTIAL_REVOKED: "credential.revoked",
    ACCESS_GRANTED: "access.granted",
    ACCESS_DENIED: "access.denied",
    SCANNER_PAIRED: "scanner.paired",
    SCANNER_UNPAIRED: "scanner.unpaired",
} as const;

export type WebhookEventTypeValue =
    (typeof WebhookEventType)[keyof typeof WebhookEventType];

export const WEBHOOK_EVENT_TYPE_VALUES = Object.values(WebhookEventType);

export const WebhookDeliveryStatus = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    DELIVERED: "DELIVERED",
    FAILED: "FAILED",
    RETRYING: "RETRYING",
    CANCELLED: "CANCELLED",
} as const;

export type WebhookDeliveryStatusValue =
    (typeof WebhookDeliveryStatus)[keyof typeof WebhookDeliveryStatus];

export const WEBHOOK_DELIVERY_STATUS_VALUES = Object.values(
    WebhookDeliveryStatus
);

/** Seconds to wait before each retry attempt (after the first failure). */
export const DEFAULT_RETRY_SCHEDULE_SECONDS = [
    60, 300, 900, 3600, 21600,
] as const;

export const DEFAULT_MAX_ATTEMPTS = 6; // 1 initial + 5 retries
export const DEFAULT_TIMEOUT_MS = 10_000;
export const WEBHOOK_USER_AGENT = "Qrezo-Webhooks/1.0";

/** Receiver-side replay window guidance (documented + used in examples). */
export const SIGNATURE_TOLERANCE_SECONDS = 300;
