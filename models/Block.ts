import mongoose, { Schema, Document, models, model } from "mongoose";
import { BLOCK_TYPES, BlockType } from "@/modules/smartpage/constants";

export interface IBlock extends Document {
    smartPageId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    blockType: BlockType;
    sortOrder: number;
    title?: string;
    config: Record<string, unknown>;
    isVisible: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BlockSchema = new Schema<IBlock>(
    {
        smartPageId: {
            type: Schema.Types.ObjectId,
            ref: "SmartPage",
            required: true,
            index: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },
        blockType: {
            type: String,
            enum: BLOCK_TYPES,
            required: true,
        },
        sortOrder: { type: Number, required: true, default: 0 },
        title: { type: String, trim: true },
        config: {
            type: Schema.Types.Mixed,
            required: true,
            default: {},
        },
        isVisible: { type: Boolean, default: true },
    },
    { timestamps: true }
);

BlockSchema.index({ smartPageId: 1, sortOrder: 1 });

const Block = models?.Block || model<IBlock>("Block", BlockSchema);

export default Block;
