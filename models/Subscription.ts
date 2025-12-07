import mongoose, { Schema, model, models } from "mongoose";

const SubscriptionSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        plan: {
            type: String,
            enum: ["free", "pro", "business"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
        },
        paymentProvider: {
            type: String,
            enum: ["razorpay", "stripe"],
            required: true,
        },
        providerOrderId: {
            type: String, // razorpay_order_id or stripe_session_id
        },
        providerPaymentId: {
            type: String, // razorpay_payment_id or stripe_payment_intent
        },
        status: {
            type: String,
            enum: ["active", "pending", "cancelled", "expired", "failed"],
            default: "pending",
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const Subscription = models?.Subscription || model("Subscription", SubscriptionSchema);

export default Subscription;
