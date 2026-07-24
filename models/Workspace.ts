import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IWorkspace extends Document {
    name: string;
    slug: string;
    ownerId: mongoose.Types.ObjectId;
    planTier: "free" | "pro" | "business" | "enterprise";
    settings: {
        defaultLanguage: string;
        timeZone: string;
        customDomain?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
    {
        name: { type: String, required: true, trim: true },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true,
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        planTier: {
            type: String,
            enum: ["free", "pro", "business", "enterprise"],
            default: "free",
        },
        settings: {
            defaultLanguage: { type: String, default: "en" },
            timeZone: { type: String, default: "UTC" },
            customDomain: { type: String, sparse: true, unique: true },
        },
    },
    { timestamps: true }
);

const Workspace =
    models?.Workspace || model<IWorkspace>("Workspace", WorkspaceSchema);

export default Workspace;
