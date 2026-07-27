import mongoose, { Schema, Document, models, model } from "mongoose";
import {
    CREDENTIAL_STATUS_VALUES,
    CredentialStatus,
    CredentialStatusValue,
} from "@/modules/event-credential/constants";

export interface ICredential extends Document {
    publicId: string;
    workspaceId: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
    attendeeId: mongoose.Types.ObjectId;
    token: string;
    tokenVersion: number;
    status: CredentialStatusValue;
    generatedAt: Date;
    expiresAt?: Date | null;
    revokedAt?: Date | null;
    revokedReason?: string | null;
    lastDownloadedAt?: Date | null;
    pngDownloadCount: number;
    svgDownloadCount: number;
    restoreCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const CredentialSchema = new Schema<ICredential>(
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
            required: true,
            index: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
            select: false, // never leak in default queries
        },
        tokenVersion: { type: Number, required: true, default: 1 },
        status: {
            type: String,
            enum: CREDENTIAL_STATUS_VALUES,
            required: true,
            default: CredentialStatus.ACTIVE,
            index: true,
        },
        generatedAt: { type: Date, required: true, default: Date.now },
        expiresAt: { type: Date, default: null },
        revokedAt: { type: Date, default: null },
        revokedReason: { type: String, trim: true, maxlength: 500, default: null },
        lastDownloadedAt: { type: Date, default: null },
        pngDownloadCount: { type: Number, default: 0, min: 0 },
        svgDownloadCount: { type: Number, default: 0, min: 0 },
        restoreCount: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);

CredentialSchema.index({ workspaceId: 1, eventId: 1, attendeeId: 1 });
CredentialSchema.index(
    { attendeeId: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: CredentialStatus.ACTIVE },
    }
);

const Credential =
    models?.Credential || model<ICredential>("Credential", CredentialSchema);

export default Credential;
