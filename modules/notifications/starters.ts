import {
    NotificationChannel,
    NotificationTriggerEvent,
} from "@/modules/notifications/constants";

export const STARTER_TEMPLATES = [
    {
        name: "Registration Confirmation",
        description: "Sent when an attendee registers",
        channel: NotificationChannel.EMAIL,
        triggerEvent: NotificationTriggerEvent.ATTENDEE_CREATED,
        subject: "You're registered for {{eventName}}",
        content:
            "Hi {{firstName}},\n\nThanks for registering for {{eventName}}.\n\nVenue: {{venue}}\nWhen: {{eventDate}}\nTicket: {{ticketType}}\n\nSee you there!",
    },
    {
        name: "Credential Ready",
        description: "Sent when a credential is generated",
        channel: NotificationChannel.EMAIL,
        triggerEvent: NotificationTriggerEvent.CREDENTIAL_GENERATED,
        subject: "Your ticket for {{eventName}} is ready",
        content:
            "Hi {{firstName}},\n\nYour credential for {{eventName}} is ready.\n\nOpen your ticket: {{credentialUrl}}\nQR: {{qrUrl}}\n\nPresent this at the gate.",
    },
    {
        name: "Credential Regenerated",
        description: "Sent when a credential is regenerated",
        channel: NotificationChannel.EMAIL,
        triggerEvent: NotificationTriggerEvent.CREDENTIAL_REGENERATED,
        subject: "Your {{eventName}} ticket was updated",
        content:
            "Hi {{firstName}},\n\nYour credential was regenerated. Previous QR codes are no longer valid.\n\nNew ticket: {{credentialUrl}}",
    },
    {
        name: "Check-in Successful",
        description: "Sent after successful access grant",
        channel: NotificationChannel.SMS,
        triggerEvent: NotificationTriggerEvent.ACCESS_GRANTED,
        subject: "",
        content:
            "Hi {{firstName}}, you're checked in to {{eventName}} at {{checkInTime}}. Enjoy the event!",
    },
    {
        name: "Event Updated",
        description: "Sent when event details change",
        channel: NotificationChannel.EMAIL,
        triggerEvent: NotificationTriggerEvent.EVENT_UPDATED,
        subject: "{{eventName}} details updated",
        content:
            "Hi {{firstName}},\n\n{{eventName}} has been updated.\n\nVenue: {{venue}}\nWhen: {{eventDate}}\n\nPlease review the latest details.",
    },
    {
        name: "Scanner Paired (WhatsApp)",
        description: "Optional staff alert when a scanner pairs",
        channel: NotificationChannel.WHATSAPP,
        triggerEvent: NotificationTriggerEvent.SCANNER_PAIRED,
        subject: "",
        content:
            "Scanner paired for {{eventName}}. Gate device is online.",
    },
] as const;
