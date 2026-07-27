import type {
    NotificationChannelValue,
    NotificationDeliveryStatusValue,
    NotificationProviderIdValue,
    NotificationTriggerEventValue,
} from "@/modules/notifications/constants";

export type PublicNotificationTemplate = {
    id: string;
    publicId: string;
    name: string;
    description: string;
    channel: NotificationChannelValue;
    triggerEvent: NotificationTriggerEventValue;
    enabled: boolean;
    subject: string;
    content: string;
    variables: string[];
    createdAt: string;
    updatedAt: string;
};

export type PublicNotificationDelivery = {
    id: string;
    publicId: string;
    workspaceId: string;
    templateId: string;
    templateName: string;
    attendeeId: string | null;
    channel: NotificationChannelValue;
    provider: NotificationProviderIdValue;
    triggerEvent: NotificationTriggerEventValue;
    status: NotificationDeliveryStatusValue;
    recipient: string;
    subject: string;
    renderedContent: string;
    error: string | null;
    attempts: number;
    providerMessageId: string | null;
    durationMs: number | null;
    deliveredAt: string | null;
    nextRetryAt: string | null;
    createdAt: string;
};

export type SendResult = {
    success: boolean;
    providerMessageId?: string | null;
    error?: string | null;
};

export type ProviderSendInput = {
    channel: NotificationChannelValue;
    recipient: string;
    subject: string;
    content: string;
    metadata?: Record<string, unknown>;
};

export interface NotificationProvider {
    readonly id: NotificationProviderIdValue;
    supports(channel: NotificationChannelValue): boolean;
    send(input: ProviderSendInput): Promise<SendResult>;
}
