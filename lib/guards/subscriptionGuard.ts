import dbConnect from "@/config/dbConnect";
import User from "@/models/User";
import QRCode from "@/models/QRCode";
import { PRICING_PLANS, PlanType } from "@/lib/pricing";

import { isValidObjectId } from "mongoose";

export async function subscriptionGuard(userId: string) {
    if (!isValidObjectId(userId)) {
        throw new Error("Invalid User Session. Please logout and login again.");
    }

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    const userPlan = (user.subscriptionPlan as PlanType) || "free";
    const planConfig = PRICING_PLANS[userPlan];

    if (!planConfig) {
        throw new Error("Invalid pricing plan configuration");
    }

    // Check QR Code Limit
    const currentQRCount = await QRCode.countDocuments({ userId, isActive: true });

    if (currentQRCount >= planConfig.maxQRCodes) {
        // Special message for free plan users
        if (userPlan === "free") {
            throw new Error(
                `Free plan limit reached! You've created ${currentQRCount}/${planConfig.maxQRCodes} QR codes. Upgrade to Pro plan to create more QR codes.`
            );
        }
        // Message for other plans
        throw new Error(
            `You have reached the limit of ${planConfig.maxQRCodes} active QR codes for the ${planConfig.name} plan. Please upgrade to create more.`
        );
    }

    return {
        authorized: true,
        plan: userPlan,
        remaining: planConfig.maxQRCodes - currentQRCount,
    };
}
