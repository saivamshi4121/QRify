import mongoose, { Schema, Document, models, model } from "mongoose";
import {
    REGISTRATION_SOURCE_VALUES,
    REGISTRATION_STATUS_VALUES,
    RegistrationSource,
    RegistrationSourceValue,
    RegistrationStatus,
    RegistrationStatusValue,
} from "@/modules/attendee/constants";

export interface IAttendee extends Document {
    publicId: string;
    workspaceId: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
    externalId?: string | null;
    registrationSource: RegistrationSourceValue;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    designation?: string;
    ticketType: string;
    registrationStatus: RegistrationStatusValue;
    notes?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const AttendeeSchema = new Schema<IAttendee>(
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
        externalId: {
            type: String,
            trim: true,
            default: null,
        },
        registrationSource: {
            type: String,
            enum: REGISTRATION_SOURCE_VALUES,
            required: true,
            default: RegistrationSource.MANUAL,
            index: true,
        },
        firstName: { type: String, required: true, trim: true, maxlength: 80 },
        lastName: { type: String, required: true, trim: true, maxlength: 80 },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 254,
            index: true,
        },
        phone: { type: String, trim: true, maxlength: 40, default: "" },
        company: { type: String, trim: true, maxlength: 160, default: "" },
        designation: { type: String, trim: true, maxlength: 120, default: "" },
        ticketType: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
            default: "General",
        },
        registrationStatus: {
            type: String,
            enum: REGISTRATION_STATUS_VALUES,
            required: true,
            default: RegistrationStatus.REGISTERED,
            index: true,
        },
        notes: { type: String, trim: true, maxlength: 2000, default: "" },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

AttendeeSchema.index({ eventId: 1, email: 1 }, { unique: true });
AttendeeSchema.index({ workspaceId: 1, eventId: 1, createdAt: -1 });
AttendeeSchema.index({ workspaceId: 1, eventId: 1, registrationStatus: 1 });

const Attendee =
    models?.Attendee || model<IAttendee>("Attendee", AttendeeSchema);

export default Attendee;
