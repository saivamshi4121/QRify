import type {
    WebhookDeliveryStatusValue,
    WebhookEventTypeValue,
} from "@/modules/webhooks/constants";

export type RetryPolicy = {
    maxAttempts: number;
    /** Delay in seconds before each retry (index 0 = after first failure). */
    scheduleSeconds: number[];
};

export type PublicWebhookEndpoint = {
    id: string;
    publicId: string;
    name: string;
    description: string;
    url: string;
    enabled: boolean;
    eventTypes: WebhookEventTypeValue[];
    retryPolicy: RetryPolicy;
    timeoutMs: number;
    secretPrefix: string;
    createdAt: string;
    updatedAt: string;
};

export type CreatedWebhookEndpoint = PublicWebhookEndpoint & {
    /** Full signing secret — only returned on create / rotate. */
    secret: string;
};

export type PublicWebhookDelivery = {
    id: string;
    publicId: string;
    webhookId: string;
    webhookName: string;
    eventType: WebhookEventTypeValue;
    status: WebhookDeliveryStatusValue;
    attempt: number;
    responseCode: number | null;
    responseBody: string | null;
    durationMs: number | null;
    errorMessage: string | null;
    deliveredAt: string | null;
    nextRetryAt: string | null;
    createdAt: string;
    payload: Record<string, unknown>;
};

export type WebhookEnvelope = {
    id: string;
    type: WebhookEventTypeValue;
    createdAt: string;
    workspaceId: string;
    data: Record<string, unknown>;
};

export type IntegrationTemplate = {
    id: string;
    name: string;
    description: string;
    category: "generic" | "automation";
    docsUrl?: string;
    defaultEventTypes: WebhookEventTypeValue[];
};
