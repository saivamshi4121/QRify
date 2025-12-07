import mongoose, { Schema, model, models } from "mongoose";

const ScanLogSchema = new Schema(
    {
        qrCodeId: {
            type: Schema.Types.ObjectId,
            ref: "QRCode",
            required: true,
        },
        ipAddress: {
            type: String,
            default: "Unknown",
        },
        userAgent: {
            type: String,
            default: "Unknown",
        },
        deviceType: {
            type: String, // mobile, tablet, desktop, bot, unknown
            default: "unknown",
        },
        os: {
            type: String,
            default: "Unknown",
        },
        browser: {
            type: String,
            default: "Unknown",
        },
        country: {
            type: String,
            default: "Unknown",
        },
        city: {
            type: String,
            default: "Unknown",
        },
        referrer: {
            type: String,
            default: "Direct",
        },
        scannedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
    }
);

// Indexes for faster analytics queries
ScanLogSchema.index({ qrCodeId: 1, scannedAt: -1 });
ScanLogSchema.index({ qrCodeId: 1, ipAddress: 1 }); // For unique scan calculation

const ScanLog = models?.ScanLog || model("ScanLog", ScanLogSchema);

export default ScanLog;
