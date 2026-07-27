import {
    WEBHOOK_EVENT_TYPE_VALUES,
    WebhookEventType,
    WebhookEventTypeValue,
} from "@/modules/webhooks/constants";
import type { IntegrationTemplate } from "@/modules/webhooks/types";

/** Easy to extend — append new event types to constants + this registry. */
export function listSupportedEventTypes(): {
    type: WebhookEventTypeValue;
    description: string;
}[] {
    const descriptions: Record<WebhookEventTypeValue, string> = {
        [WebhookEventType.EVENT_CREATED]: "An event was created",
        [WebhookEventType.EVENT_UPDATED]: "An event was updated",
        [WebhookEventType.EVENT_DELETED]: "An event was deleted",
        [WebhookEventType.ATTENDEE_CREATED]: "An attendee was registered",
        [WebhookEventType.ATTENDEE_UPDATED]: "An attendee was updated",
        [WebhookEventType.ATTENDEE_DELETED]: "An attendee was deleted",
        [WebhookEventType.CREDENTIAL_GENERATED]: "A credential was generated",
        [WebhookEventType.CREDENTIAL_REGENERATED]:
            "A credential was regenerated",
        [WebhookEventType.CREDENTIAL_REVOKED]: "A credential was revoked",
        [WebhookEventType.ACCESS_GRANTED]: "Access was granted at a gate",
        [WebhookEventType.ACCESS_DENIED]: "Access was denied at a gate",
        [WebhookEventType.SCANNER_PAIRED]: "A scanner device was paired",
        [WebhookEventType.SCANNER_UNPAIRED]: "A scanner device was unpaired",
    };

    return WEBHOOK_EVENT_TYPE_VALUES.map((type) => ({
        type,
        description: descriptions[type],
    }));
}

export const INTEGRATION_TEMPLATES: IntegrationTemplate[] = [
    {
        id: "generic",
        name: "Generic Webhook",
        description:
            "Send signed HTTPS POST payloads to any endpoint you control.",
        category: "generic",
        defaultEventTypes: [...WEBHOOK_EVENT_TYPE_VALUES],
    },
    {
        id: "n8n",
        name: "n8n",
        description:
            "Paste your n8n Webhook node URL. Verify X-Qrezo-Signature in a Function node.",
        category: "automation",
        docsUrl: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/",
        defaultEventTypes: [
            WebhookEventType.ATTENDEE_CREATED,
            WebhookEventType.ACCESS_GRANTED,
            WebhookEventType.CREDENTIAL_GENERATED,
        ],
    },
    {
        id: "zapier",
        name: "Zapier",
        description:
            "Use a Zapier Catch Hook URL as the endpoint. Filter by X-Qrezo-Event.",
        category: "automation",
        docsUrl: "https://zapier.com/apps/webhook/integrations",
        defaultEventTypes: [
            WebhookEventType.ATTENDEE_CREATED,
            WebhookEventType.ATTENDEE_UPDATED,
            WebhookEventType.ACCESS_GRANTED,
        ],
    },
    {
        id: "make",
        name: "Make.com",
        description:
            "Use a Make custom webhook URL. Map payload.data fields in your scenario.",
        category: "automation",
        docsUrl: "https://www.make.com/en/help/tools/webhooks",
        defaultEventTypes: [
            WebhookEventType.ATTENDEE_CREATED,
            WebhookEventType.CREDENTIAL_GENERATED,
            WebhookEventType.ACCESS_GRANTED,
        ],
    },
];

export function listIntegrationTemplates() {
    return INTEGRATION_TEMPLATES;
}
