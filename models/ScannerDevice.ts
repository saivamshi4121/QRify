import {
    SCANNER_DEVICE_STATUS_VALUES,
    ScannerDeviceStatus,
    ScannerDeviceStatusValue,
} from "@/modules/scanner-device/constants";
import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IScannerDevice extends Document {
    publicId: string;
    workspaceId: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
    name: string;
    gate: string;
    status: ScannerDeviceStatusValue;
    pairingCodeHash?: string | null;
    pairingExpiresAt?: Date | null;
    pairedAt?: Date | null;
    pairedBy?: mongoose.Types.ObjectId | null;
    deviceFingerprint?: string | null;
    lastSeen?: Date | null;
    lastScanAt?: Date | null;
    appVersion?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const ScannerDeviceSchema = new Schema<IScannerDevice>(
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
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
            default: "Scanner",
        },
        gate: {
            type: String,
            trim: true,
            maxlength: 120,
            default: "",
        },
        status: {
            type: String,
            enum: SCANNER_DEVICE_STATUS_VALUES,
            required: true,
            default: ScannerDeviceStatus.PAIRING,
            index: true,
        },
        pairingCodeHash: {
            type: String,
            default: null,
            select: false,
            index: true,
        },
        pairingExpiresAt: {
            type: Date,
            default: null,
            index: true,
        },
        pairedAt: { type: Date, default: null },
        pairedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        deviceFingerprint: {
            type: String,
            default: null,
            maxlength: 200,
        },
        lastSeen: { type: Date, default: null, index: true },
        lastScanAt: { type: Date, default: null },
        appVersion: { type: String, default: null, maxlength: 40 },
    },
    { timestamps: true }
);

ScannerDeviceSchema.index({ eventId: 1, status: 1 });
ScannerDeviceSchema.index({ workspaceId: 1, eventId: 1 });

const ScannerDevice =
    models?.ScannerDevice ||
    model<IScannerDevice>("ScannerDevice", ScannerDeviceSchema);

export default ScannerDevice;
