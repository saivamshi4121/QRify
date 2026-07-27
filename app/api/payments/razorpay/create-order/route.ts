import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Razorpay from "razorpay";
import { authOptions } from "@/lib/auth";
import { PRICING_PLANS } from "@/lib/pricing";
import { checkoutPlanSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/core/errors/handleApiError";
import { UnauthorizedError } from "@/core/errors/AppError";

function getRazorpay() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error("Razorpay credentials are not configured");
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            throw new UnauthorizedError("Unauthorized");
        }

        const body = await request.json();
        const { plan } = checkoutPlanSchema.parse(body);
        const planConfig = PRICING_PLANS[plan];
        const amountInPaise = planConfig.price * 100;
        const razorpay = getRazorpay();

        const options = {
            amount: amountInPaise,
            currency: planConfig.currency,
            receipt: `rcpt_${Date.now()}_${session.user.id.slice(0, 6)}`,
            notes: {
                userId: session.user.id,
                plan: plan,
            },
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        });

    } catch (error) {
        return handleApiError(error, "Razorpay Order Creation Error");
    }
}
