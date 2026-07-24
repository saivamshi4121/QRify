import mongoose, { Schema, Document, models, model } from "mongoose";

export type WorkspaceRole = "owner" | "admin" | "member";

export interface IWorkspaceMember extends Document {
    workspaceId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    role: WorkspaceRole;
    createdAt: Date;
    updatedAt: Date;
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        role: {
            type: String,
            enum: ["owner", "admin", "member"],
            required: true,
        },
    },
    { timestamps: true }
);

WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

const WorkspaceMember =
    models?.WorkspaceMember ||
    model<IWorkspaceMember>("WorkspaceMember", WorkspaceMemberSchema);

export default WorkspaceMember;
