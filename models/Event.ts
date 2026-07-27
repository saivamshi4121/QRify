import mongoose, { Schema, Document, models, model } from "mongoose";
import {
    EVENT_STATUS_VALUES,
    EventStatus,
    EventStatusValue,
} from "@/modules/event/constants";

export interface IEvent extends Document {
    workspaceId: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    banner?: string;
    venue?: string;
    timezone: string;
    startDate: Date;
    endDate: Date;
    status: EventStatusValue;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },
        name: { type: String, required: true, trim: true, maxlength: 160 },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        description: { type: String, trim: true, maxlength: 5000, default: "" },
        logo: { type: String, trim: true, default: "" },
        banner: { type: String, trim: true, default: "" },
        venue: { type: String, trim: true, maxlength: 300, default: "" },
        timezone: {
            type: String,
            required: true,
            trim: true,
            default: "UTC",
        },
        startDate: { type: Date, required: true, index: true },
        endDate: { type: Date, required: true },
        status: {
            type: String,
            enum: EVENT_STATUS_VALUES,
            default: EventStatus.DRAFT,
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

EventSchema.index({ workspaceId: 1, startDate: -1 });
EventSchema.index({ workspaceId: 1, status: 1 });
EventSchema.index({ workspaceId: 1, name: "text" });

const Event = models?.Event || model<IEvent>("Event", EventSchema);

export default Event;
