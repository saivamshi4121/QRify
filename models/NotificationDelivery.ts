import mongoose, { Schema, Document, models, model } from "mongoose";
import {
    NOTIFICATION_CHANNEL_VALUES,
    NOTIFICATION_DELIVERY_STATUS_VALUES,
    NOTIFICATION_TRIGGER_EVENT_VALUES,
    NotificationDeliveryStatus,
    NotificationProviderId,
    type NotificationChannelValue,
    type NotificationDeliveryStatusValue,
    type NotificationProviderIdValue,
    type NotificationTriggerEventValue,
} from "@/modules/notifications/constants";

export interface INotificationDelivery extends Document {
    publicId: string;
    workspaceId: mongoose.Types.ObjectId;
    templateId: mongoose.Types.ObjectId;
    attendeeId?: string | null;
    channel: NotificationChannelValue;
    provider: NotificationProviderIdValue;
    triggerEvent: NotificationTriggerEventValue;
    status: NotificationDeliveryStatusValue;
    recipient: string;
    subject: string;
    renderedContent: string;
    error?: string | null;
    attempts: number;
    providerMessageId?: string | null;
    durationMs?: number | null;
    deliveredAt?: Date | null;
    nextRetryAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationDeliverySchema = new Schema<INotificationDelivery>(
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
        templateId: {
            type: Schema.Types.ObjectId,
            ref: "NotificationTemplate",
            required: true,
            index: true,
        },
        attendeeId: { type: String, default: null, index: true },
        channel: {
            type: String,
            enum: NOTIFICATION_CHANNEL_VALUES,
            required: true,
            index: true,
        },
        provider: {
            type: String,
            required: true,
            default: NotificationProviderId.CONSOLE,
        },
        triggerEvent: {
            type: String,
            enum: NOTIFICATION_TRIGGER_EVENT_VALUES,
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: NOTIFICATION_DELIVERY_STATUS_VALUES,
            required: true,
            default: NotificationDeliveryStatus.PENDING,
            index: true,
        },
        recipient: { type: String, required: true, maxlength: 320 },
        subject: { type: String, default: "", maxlength: 300 },
        renderedContent: { type: String, required: true, maxlength: 12000 },
        error: { type: String, default: null, maxlength: 1000 },
        attempts: { type: Number, required: true, default: 0 },
        providerMessageId: { type: String, default: null },
        durationMs: { type: Number, default: null },
        deliveredAt: { type: Date, default: null },
        nextRetryAt: { type: Date, default: null, index: true },
    },
    { timestamps: true }
);

NotificationDeliverySchema.index({ workspaceId: 1, createdAt: -1 });
NotificationDeliverySchema.index({ status: 1, nextRetryAt: 1 });

const NotificationDelivery =
    models?.NotificationDelivery ||
    model<INotificationDelivery>(
        "NotificationDelivery",
        NotificationDeliverySchema
    );

export default NotificationDelivery;
