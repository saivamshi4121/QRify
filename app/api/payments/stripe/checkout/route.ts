import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth";
import { PRICING_PLANS } from "@/lib/pricing";
import { checkoutPlanSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/core/errors/handleApiError";
import { UnauthorizedError } from "@/core/errors/AppError";

function getStripe() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
        throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    return new Stripe(stripeKey, {
        apiVersion: "2025-11-17.clover",
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
        const stripe = getStripe();

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `${planConfig.name} Plan`,
                            description: planConfig.description,
                        },
                        unit_amount: planConfig.price * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
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
        return handleApiError(error, "Stripe Checkout Error");
    }
}
