import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/config/dbConnect";
import Subscription from "@/models/Subscription";
import User from "@/models/User";

export async function POST(request: Request) {
    try {
        const body = await request.text(); // Read raw body for verification sometimes needed, but Razorpay sends JSON
        // Note: Razorpay webhook signature verification usually requires the raw body. 
        // In Next.js, we can get text first then parse JSON.

        // However, the signature is a HMAC HEX digest of the request body. 
        // So we must use the raw string body.

        const signature = request.headers.get("x-razorpay-signature");
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!signature || !secret) {
            return NextResponse.json(
                { success: false, message: "Missing signature or secret" },
                { status: 400 }
            );
        }

        // Verify Signature
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        if (expectedSignature !== signature) {
            return NextResponse.json(
                { success: false, message: "Invalid signature" },
                { status: 400 }
            );
        }

        const event = JSON.parse(body);

        await dbConnect();

        // Handle Payment Captured
        if (event.event === "payment.captured") {
            const payment = event.payload.payment.entity;
            const notes = payment.notes;
            const userId = notes.userId;
            const plan = notes.plan;

            if (userId && plan) {
                // 1. Create Subscription
                // Calculate end date (e.g. 30 days from now)
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(startDate.getDate() + 30);

                await Subscription.create({
                    userId,
                    plan,
                    amount: payment.amount / 100, // Convert paise to main unit
                    currency: payment.currency,
                    paymentProvider: "razorpay",
                    providerOrderId: payment.order_id,
                    providerPaymentId: payment.id,
                    status: "active",
                    startDate,
                    endDate,
                });

                // 2. Update User Plan
                await User.findByIdAndUpdate(userId, {
                    subscriptionPlan: plan,
                });
            }
        }

        // Handle Payment Failed (Optional)
        if (event.event === "payment.failed") {
            // Log failure or notify user
            console.log("Payment failed for:", event.payload.payment.entity.notes);
        }

        return NextResponse.json({ success: true, status: "ok" });

    } catch (error) {
        console.error("Razorpay Webhook Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
