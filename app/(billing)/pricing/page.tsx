"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { PRICING_PLANS } from "@/lib/pricing";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function PricingPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async (planKey: string) => {
        if (!session) {
            router.push("/login?redirect=/pricing");
            return;
        }

        // For Free plan, specific logic or just nothing
        if (planKey === "free") {
            router.push("/dashboard");
            return;
        }

        setLoadingPlan(planKey);

        try {
            const isScriptLoaded = await loadRazorpayScript();
            if (!isScriptLoaded) {
                alert("Razorpay SDK failed to load. Are you online?");
                setLoadingPlan(null);
                return;
            }

            // 1. Create Order
            const res = await fetch("/api/payments/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: planKey }),
            });
            const data = await res.json();

            if (!data.success) {
                alert(data.message);
                setLoadingPlan(null);
                return;
            }

            // 2. Open Razorpay Checkout
            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "SmartQR SaaS",
                description: `Upgrade to ${PRICING_PLANS[planKey as keyof typeof PRICING_PLANS].name}`,
                order_id: data.orderId,
                handler: async function (response: any) {
                    // In a real flow, you might post to a verify endpoint here, or rely on webhook.
                    // Relying on webhook is safer for DB updates, but UI needs feedback.
                    alert("Payment Successful! Your plan will be updated shortly.");
                    router.push("/dashboard");
                    router.refresh(); // Refresh to update session data if using invalidation
                },
                prefill: {
                    name: session.user?.name,
                    email: session.user?.email,
                },
                theme: {
                    color: "#4f46e5",
                },
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-20 px-4">
            <div className="mx-auto max-w-7xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    Simple, transparent pricing
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                    Choose the plan that's right for you. Change or cancel at any time.
                </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-1 md:grid-cols-3">
                {Object.entries(PRICING_PLANS).map(([key, plan]) => {
                    const isPopular = key === "pro";
                    return (
                        <div
                            key={key}
                            className={`relative flex flex-col rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-lg ${isPopular ? "scale-105 shadow-xl ring-2 ring-indigo-600" : ""
                                }`}
                        >
                            {isPopular && (
                                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold text-white">
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                            <p className="mt-2 text-sm text-slate-500 min-h-[40px]">{plan.description}</p>

                            <div className="my-6 flex items-baseline">
                                <span className="text-4xl font-bold tracking-tight text-slate-900">
                                    {plan.currency === "INR" ? "₹" : "$"}
                                    {plan.price}
                                </span>
                                <span className="ml-1 text-slate-500">/month</span>
                            </div>

                            <ul className="mb-8 space-y-4 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start">
                                        <Check className="mr-3 h-5 w-5 shrink-0 text-emerald-500" />
                                        <span className="text-sm text-slate-600">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleUpgrade(key)}
                                disabled={loadingPlan !== null}
                                className={`mt-auto w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${isPopular
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                        : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                                    } ${loadingPlan !== null ? "opacity-70 cursor-not-allowed" : ""}`}
                            >
                                {loadingPlan === key ? (
                                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                ) : key === "free" ? (
                                    "Get Started"
                                ) : (
                                    "Upgrade Now"
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
