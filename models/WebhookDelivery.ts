import mongoose, { Schema, Document, models, model } from "mongoose";
import {
    WEBHOOK_DELIVERY_STATUS_VALUES,
    WEBHOOK_EVENT_TYPE_VALUES,
    WebhookDeliveryStatus,
    WebhookDeliveryStatusValue,
    WebhookEventTypeValue,
} from "@/modules/webhooks/constants";

export interface IWebhookDelivery extends Document {
    publicId: string;
    webhookId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    eventType: WebhookEventTypeValue;
    payload: Record<string, unknown>;
    status: WebhookDeliveryStatusValue;
    attempt: number;
    responseCode?: number | null;
    responseBody?: string | null;
    requestHeaders?: Record<string, string> | null;
    durationMs?: number | null;
    errorMessage?: string | null;
    deliveredAt?: Date | null;
    nextRetryAt?: Date | null;
    replayOf?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const WebhookDeliverySchema = new Schema<IWebhookDelivery>(
    {
        publicId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        webhookId: {
            type: Schema.Types.ObjectId,
            ref: "WebhookEndpoint",
            required: true,
            index: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },
        eventType: {
            type: String,
            enum: WEBHOOK_EVENT_TYPE_VALUES,
            required: true,
            index: true,
        },
        payload: { type: Schema.Types.Mixed, required: true },
        status: {
            type: String,
            enum: WEBHOOK_DELIVERY_STATUS_VALUES,
            required: true,
            default: WebhookDeliveryStatus.PENDING,
            index: true,
        },
        attempt: { type: Number, required: true, default: 0 },
        responseCode: { type: Number, default: null },
        responseBody: { type: String, default: null, maxlength: 4000 },
        requestHeaders: { type: Schema.Types.Mixed, default: null },
        durationMs: { type: Number, default: null },
        errorMessage: { type: String, default: null, maxlength: 1000 },
        deliveredAt: { type: Date, default: null },
        nextRetryAt: { type: Date, default: null, index: true },
        replayOf: {
            type: Schema.Types.ObjectId,
            ref: "WebhookDelivery",
            default: null,
        },
    },
    { timestamps: true }
);

WebhookDeliverySchema.index({ workspaceId: 1, createdAt: -1 });
WebhookDeliverySchema.index({ status: 1, nextRetryAt: 1 });

const WebhookDelivery =
    models?.WebhookDelivery ||
    model<IWebhookDelivery>("WebhookDelivery", WebhookDeliverySchema);

export default WebhookDelivery;
