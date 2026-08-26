import dbConnect from "@/config/dbConnect";
import User from "@/models/User";
import { isValidObjectId } from "mongoose";
import { assertWithinLimit } from "@/modules/entitlement/service";

/**
 * @deprecated Legacy subscription guard wrapper.
 * Endpoints should use EntitlementService.assertWithinLimit(workspaceId, resourceKey) directly.
 */
export async function subscriptionGuard(userId: string, workspaceId?: string) {
    if (!isValidObjectId(userId)) {
        throw new Error("Invalid User Session. Please logout and login again.");
    }

    await dbConnect();

    if (workspaceId) {
        await assertWithinLimit(workspaceId, "qr_codes");
        return { authorized: true };
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    return { authorized: true };
}
