import mongoose, { Schema, Document, models, model } from "mongoose";
import {
    NOTIFICATION_CHANNEL_VALUES,
    NOTIFICATION_TRIGGER_EVENT_VALUES,
    NotificationChannel,
    NotificationTriggerEvent,
    type NotificationChannelValue,
    type NotificationTriggerEventValue,
} from "@/modules/notifications/constants";

export interface INotificationTemplate extends Document {
    publicId: string;
    workspaceId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    channel: NotificationChannelValue;
    triggerEvent: NotificationTriggerEventValue;
    enabled: boolean;
    subject: string;
    content: string;
    variables: string[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>(
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
        channel: {
            type: String,
            enum: NOTIFICATION_CHANNEL_VALUES,
            required: true,
            default: NotificationChannel.EMAIL,
            index: true,
        },
        triggerEvent: {
            type: String,
            enum: NOTIFICATION_TRIGGER_EVENT_VALUES,
            required: true,
            default: NotificationTriggerEvent.ATTENDEE_CREATED,
            index: true,
        },
        enabled: { type: Boolean, default: true, index: true },
        subject: { type: String, trim: true, maxlength: 300, default: "" },
        content: { type: String, required: true, maxlength: 10000 },
        variables: { type: [String], default: [] },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

NotificationTemplateSchema.index({
    workspaceId: 1,
    triggerEvent: 1,
    enabled: 1,
});

const NotificationTemplate =
    models?.NotificationTemplate ||
    model<INotificationTemplate>(
        "NotificationTemplate",
        NotificationTemplateSchema
    );

export default NotificationTemplate;
