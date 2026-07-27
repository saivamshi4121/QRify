export const NotificationChannel = {
    EMAIL: "email",
    SMS: "sms",
    WHATSAPP: "whatsapp",
    // Future: PUSH: "push",
} as const;

export type NotificationChannelValue =
    (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const NOTIFICATION_CHANNEL_VALUES = Object.values(NotificationChannel);

/** Subset of domain events that can trigger notifications. */
export const NotificationTriggerEvent = {
    ATTENDEE_CREATED: "attendee.created",
    CREDENTIAL_GENERATED: "credential.generated",
    CREDENTIAL_REGENERATED: "credential.regenerated",
    ACCESS_GRANTED: "access.granted",
    EVENT_UPDATED: "event.updated",
    SCANNER_PAIRED: "scanner.paired",
} as const;

export type NotificationTriggerEventValue =
    (typeof NotificationTriggerEvent)[keyof typeof NotificationTriggerEvent];

export const NOTIFICATION_TRIGGER_EVENT_VALUES = Object.values(
    NotificationTriggerEvent
);

export const NotificationDeliveryStatus = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    DELIVERED: "DELIVERED",
    FAILED: "FAILED",
    RETRYING: "RETRYING",
    CANCELLED: "CANCELLED",
} as const;

export type NotificationDeliveryStatusValue =
    (typeof NotificationDeliveryStatus)[keyof typeof NotificationDeliveryStatus];

export const NOTIFICATION_DELIVERY_STATUS_VALUES = Object.values(
    NotificationDeliveryStatus
);

export const NotificationProviderId = {
    CONSOLE: "console",
    // Future: SENDGRID, TWILIO, etc.
} as const;

export type NotificationProviderIdValue =
    (typeof NotificationProviderId)[keyof typeof NotificationProviderId];

export const DEFAULT_NOTIFICATION_RETRY_SCHEDULE_SECONDS = [
    60, 300, 900, 3600, 21600,
] as const;

export const DEFAULT_NOTIFICATION_MAX_ATTEMPTS = 6;

export const TEMPLATE_VARIABLES = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "eventName",
    "eventDate",
    "eventEndDate",
    "venue",
    "credentialUrl",
    "qrUrl",
    "checkInTime",
    "ticketType",
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
