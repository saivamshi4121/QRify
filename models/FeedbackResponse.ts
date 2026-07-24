import mongoose, { Schema, Document, models, model } from "mongoose";
import {
    FEEDBACK_STATUS_VALUES,
    FEEDBACK_ROUTING_VALUES,
    FeedbackStatus,
    FeedbackStatusValue,
    FeedbackRoutingResultValue,
} from "@/modules/feedback/constants";

export interface IFeedbackResponse extends Document {
    workspaceId: mongoose.Types.ObjectId;
    smartPageId: mongoose.Types.ObjectId;
    qrCodeId?: mongoose.Types.ObjectId;
    ratingScore: number;
    category?: string;
    commentText?: string;
    customerName?: string;
    customerPhone?: string;
    locationTag?: string;
    status: FeedbackStatusValue;
    routingResult: FeedbackRoutingResultValue;
    reviewClicked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FeedbackResponseSchema = new Schema<IFeedbackResponse>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },
        smartPageId: {
            type: Schema.Types.ObjectId,
            ref: "SmartPage",
            required: true,
            index: true,
        },
        qrCodeId: {
            type: Schema.Types.ObjectId,
            ref: "QRCode",
            required: false,
            index: true,
        },
        ratingScore: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            index: true,
        },
        category: { type: String, trim: true },
        commentText: { type: String, trim: true, maxlength: 2000 },
        customerName: { type: String, trim: true },
        customerPhone: { type: String, trim: true },
        locationTag: { type: String, trim: true, index: true },
        status: {
            type: String,
            enum: FEEDBACK_STATUS_VALUES,
            default: FeedbackStatus.NEW,
            index: true,
        },
        routingResult: {
            type: String,
            enum: FEEDBACK_ROUTING_VALUES,
            required: true,
            index: true,
        },
        reviewClicked: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

FeedbackResponseSchema.index({ workspaceId: 1, createdAt: -1 });
FeedbackResponseSchema.index({ smartPageId: 1, createdAt: -1 });

const FeedbackResponse =
    models?.FeedbackResponse ||
    model<IFeedbackResponse>("FeedbackResponse", FeedbackResponseSchema);

export default FeedbackResponse;
