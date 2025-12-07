import mongoose, { Schema, model, models } from "mongoose";

const QRCodeSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        qrName: {
            type: String,
            required: true,
            trim: true,
        },
        qrType: {
            type: String,
            enum: ["url", "text", "email", "phone", "whatsapp", "wifi", "upi"],
            required: true,
        },
        originalData: {
            type: String,
            required: true,
        },
        shortUrl: {
            type: String,
            unique: true,
            required: true,
            index: true,
        },
        qrImageUrl: {
            type: String,
            required: true,
        },
        isDynamic: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        expiryDate: {
            type: Date,
        },
        scanLimit: {
            type: Number,
        },
        scanCount: {
            type: Number,
            default: 0,
        },
        // Design Fields
        foregroundColor: { type: String, default: "#000000" },
        backgroundColor: { type: String, default: "#ffffff" },
        gradient: { type: String, default: null },
        eyeShape: {
            type: String,
            enum: ["square", "circle"],
            default: "square",
        },
        qrStyle: {
            type: String,
            enum: ["dots", "rounded", "square"],
            default: "square",
        },
        logoUrl: { type: String },
    },
    {
        timestamps: true,
    }
);

const QRCode = models?.QRCode || model("QRCode", QRCodeSchema);

export default QRCode;
