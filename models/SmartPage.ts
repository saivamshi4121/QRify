import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ISmartPageTheme {
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
    logoUrl?: string;
}

export interface ISmartPage extends Document {
    workspaceId: mongoose.Types.ObjectId;
    title: string;
    slug: string;
    theme: ISmartPageTheme;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SmartPageSchema = new Schema<ISmartPage>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },
        title: { type: String, required: true, trim: true },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        theme: {
            primaryColor: { type: String, default: "#0f172a" },
            backgroundColor: { type: String, default: "#ffffff" },
            fontFamily: { type: String, default: "system-ui, sans-serif" },
            logoUrl: { type: String },
        },
        isPublished: { type: Boolean, default: false, index: true },
    },
    { timestamps: true }
);

SmartPageSchema.index({ workspaceId: 1, slug: 1 });

const SmartPage =
    models?.SmartPage || model<ISmartPage>("SmartPage", SmartPageSchema);

export default SmartPage;
