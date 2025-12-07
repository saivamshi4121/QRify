import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Razorpay from "razorpay";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PRICING_PLANS, PlanType } from "@/lib/pricing";

// Lazy Razorpay initialization to avoid build-time errors
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
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const plan = body.plan as PlanType;

        if (!PRICING_PLANS[plan] || plan === "free") {
            return NextResponse.json(
                { success: false, message: "Invalid plan selected" },
                { status: 400 }
            );
        }

        const planConfig = PRICING_PLANS[plan];
        const amountInPaise = planConfig.price * 100;

        // Initialize Razorpay (lazy)
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
        console.error("Razorpay Order Creation Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
