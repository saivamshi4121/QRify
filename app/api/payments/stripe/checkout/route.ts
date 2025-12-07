import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PRICING_PLANS, PlanType } from "@/lib/pricing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-11-17.clover", // Latest Stripe API version
});

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

        // For Stripe, we create a Checkout Session
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd", // Using USD for international example, or logic to switch
                        product_data: {
                            name: `${planConfig.name} Plan`,
                            description: planConfig.description,
                        },
                        unit_amount: planConfig.price * 100, // Assuming price in smallest unit, converting logic needed if INR vs USD
                        // Real app would likely have explicit Stripe Price IDs mapped in PRICING_PLANS
                    },
                    quantity: 1,
                },
            ],
            mode: "payment", // "subscription" if using Stripe Billing with recurring Price IDs
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
            metadata: {
                userId: session.user.id,
                plan: plan,
            },
        });

        return NextResponse.json({
            success: true,
            sessionUrl: checkoutSession.url,
            sessionId: checkoutSession.id,
        });

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
