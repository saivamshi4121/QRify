import mongoose, { Schema, Document, models, model } from "mongoose";
import {
    API_KEY_ENVIRONMENT_VALUES,
    API_KEY_SCOPE_VALUES,
    ApiKeyEnvironment,
    ApiKeyEnvironmentValue,
    ApiKeyScopeValue,
} from "@/modules/api-key/constants";

export interface IApiKey extends Document {
    publicId: string;
    workspaceId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    keyHash: string;
    keyPrefix: string;
    permissions: ApiKeyScopeValue[];
    environment: ApiKeyEnvironmentValue;
    lastUsedAt?: Date | null;
    expiresAt?: Date | null;
    revokedAt?: Date | null;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
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
        keyHash: {
            type: String,
            required: true,
            unique: true,
            select: false,
            index: true,
        },
        keyPrefix: { type: String, required: true, maxlength: 20, index: true },
        permissions: {
            type: [String],
            enum: API_KEY_SCOPE_VALUES,
            required: true,
            default: [],
        },
        environment: {
            type: String,
            enum: API_KEY_ENVIRONMENT_VALUES,
            required: true,
            default: ApiKeyEnvironment.TEST,
            index: true,
        },
        lastUsedAt: { type: Date, default: null },
        expiresAt: { type: Date, default: null },
        revokedAt: { type: Date, default: null, index: true },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

ApiKeySchema.index({ workspaceId: 1, revokedAt: 1 });

const ApiKey = models?.ApiKey || model<IApiKey>("ApiKey", ApiKeySchema);
export default ApiKey;
