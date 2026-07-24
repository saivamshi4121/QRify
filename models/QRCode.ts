import mongoose, { Schema, model, models } from "mongoose";

const QRCodeSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: false,
            index: true,
        },
        smartPageId: {
            type: Schema.Types.ObjectId,
            ref: "SmartPage",
            required: false,
            index: true,
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
            index: true,
        },
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

// Hot-reload safety: ensure new tenant fields exist on a previously compiled model
if (!QRCode.schema.path("workspaceId")) {
    QRCode.schema.add({
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: false,
            index: true,
        },
    });
}
if (!QRCode.schema.path("smartPageId")) {
    QRCode.schema.add({
        smartPageId: {
            type: Schema.Types.ObjectId,
            ref: "SmartPage",
            required: false,
            index: true,
        },
    });
}

export default QRCode;
