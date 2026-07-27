import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IApiRequestLog extends Document {
    publicId: string;
    workspaceId: mongoose.Types.ObjectId;
    apiKeyId: mongoose.Types.ObjectId;
    apiKeyPublicId: string;
    apiKeyName: string;
    method: string;
    endpoint: string;
    statusCode: number;
    latencyMs: number;
    errorCode?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const ApiRequestLogSchema = new Schema<IApiRequestLog>(
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
        apiKeyId: {
            type: Schema.Types.ObjectId,
            ref: "ApiKey",
            required: true,
            index: true,
        },
        apiKeyPublicId: { type: String, required: true, index: true },
        apiKeyName: { type: String, required: true },
        method: { type: String, required: true, maxlength: 10 },
        endpoint: { type: String, required: true, maxlength: 300 },
        statusCode: { type: Number, required: true },
        latencyMs: { type: Number, required: true, default: 0 },
        errorCode: { type: String, default: null, maxlength: 80 },
    },
    { timestamps: true }
);

ApiRequestLogSchema.index({ workspaceId: 1, createdAt: -1 });
ApiRequestLogSchema.index({ apiKeyId: 1, createdAt: -1 });

const ApiRequestLog =
    models?.ApiRequestLog ||
    model<IApiRequestLog>("ApiRequestLog", ApiRequestLogSchema);

export default ApiRequestLog;
