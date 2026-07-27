import mongoose, { Schema, Document, models, model } from "mongoose";
import {
    WEBHOOK_EVENT_TYPE_VALUES,
    DEFAULT_TIMEOUT_MS,
    WebhookEventTypeValue,
} from "@/modules/webhooks/constants";

export interface IWebhookEndpoint extends Document {
    publicId: string;
    workspaceId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    url: string;
    secret: string;
    enabled: boolean;
    eventTypes: WebhookEventTypeValue[];
    retryPolicy: {
        maxAttempts: number;
        scheduleSeconds: number[];
    };
    timeoutMs: number;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const WebhookEndpointSchema = new Schema<IWebhookEndpoint>(
    {
        publicId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },
        name: { type: String, required: true, trim: true, maxlength: 120 },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        url: { type: String, required: true, maxlength: 2048 },
        secret: {
            type: String,
            required: true,
            select: false,
        },
        enabled: { type: Boolean, default: true, index: true },
        eventTypes: {
            type: [String],
            enum: WEBHOOK_EVENT_TYPE_VALUES,
            required: true,
            default: [],
        },
        retryPolicy: {
            maxAttempts: { type: Number, required: true, default: 6 },
            scheduleSeconds: {
                type: [Number],
                required: true,
                default: [60, 300, 900, 3600, 21600],
            },
        },
        timeoutMs: {
            type: Number,
            required: true,
            default: DEFAULT_TIMEOUT_MS,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

WebhookEndpointSchema.index({ workspaceId: 1, enabled: 1 });

const WebhookEndpoint =
    models?.WebhookEndpoint ||
    model<IWebhookEndpoint>("WebhookEndpoint", WebhookEndpointSchema);

export default WebhookEndpoint;
