import mongoose, { Schema, Document, models, model } from "mongoose";
import {
    ACCESS_RESULT_VALUES,
    ACCESS_TYPE_VALUES,
    AccessResult,
    AccessResultValue,
    AccessType,
    AccessTypeValue,
} from "@/modules/access-event/constants";

export interface IAccessEvent extends Document {
    publicId: string;
    workspaceId: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
    attendeeId?: mongoose.Types.ObjectId | null;
    credentialId?: mongoose.Types.ObjectId | null;
    type: AccessTypeValue;
    result: AccessResultValue;
    gate: string;
    checkedByUserId?: mongoose.Types.ObjectId | null;
    deviceId?: string | null;
    notes?: string;
    metadata?: Record<string, unknown>;
    occurredAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AccessEventSchema = new Schema<IAccessEvent>(
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
        eventId: {
            type: Schema.Types.ObjectId,
            ref: "Event",
            required: true,
            index: true,
        },
        attendeeId: {
            type: Schema.Types.ObjectId,
            ref: "Attendee",
            default: null,
            index: true,
        },
        credentialId: {
            type: Schema.Types.ObjectId,
            ref: "Credential",
            default: null,
            index: true,
        },
        type: {
            type: String,
            enum: ACCESS_TYPE_VALUES,
            required: true,
            default: AccessType.ENTRY,
            index: true,
        },
        result: {
            type: String,
            enum: ACCESS_RESULT_VALUES,
            required: true,
            default: AccessResult.DENIED,
            index: true,
        },
        gate: { type: String, trim: true, maxlength: 120, default: "Main" },
        checkedByUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        deviceId: { type: String, trim: true, maxlength: 120, default: null },
        notes: { type: String, trim: true, maxlength: 1000, default: "" },
        metadata: { type: Schema.Types.Mixed, default: {} },
        occurredAt: { type: Date, required: true, default: Date.now, index: true },
    },
    { timestamps: true }
);

AccessEventSchema.index({ workspaceId: 1, eventId: 1, occurredAt: -1 });
AccessEventSchema.index({ eventId: 1, attendeeId: 1, type: 1, result: 1 });

const AccessEvent =
    models?.AccessEvent || model<IAccessEvent>("AccessEvent", AccessEventSchema);

export default AccessEvent;
