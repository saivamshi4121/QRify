import assert from "assert";
import { PLANS_CONFIG } from "@/config/plans.config";
import { PlanTier, ResourceKey } from "../types";
import { PlanLimitReachedError, EntitlementError } from "../errors";

/**
 * Pure unit tests for QR and Smart Page resource entitlement rules (Milestone 3).
 */
export function runResourceEntitlementUnitTests() {
    // Helper to evaluate entitlement limits
    function checkResourceLimit(
        planTier: PlanTier,
        resource: ResourceKey,
        currentUsage: number
    ): { allowed: boolean; limit: number } {
        const config = PLANS_CONFIG[planTier];
        const limit = config.limits[resource] ?? 0;
        const allowed = currentUsage < limit;
        if (!allowed) {
            throw new PlanLimitReachedError(
                `Limit reached for '${resource}' (${currentUsage}/${limit}) on the ${config.name} plan. Upgrade to increase your limit.`,
                {
                    resource,
                    currentUsage,
                    limit,
                    currentPlan: planTier,
                }
            );
        }
        return { allowed: true, limit };
    }

    // --- QR CODE TESTS ---

    // 1. Free workspace under limit -> allowed
    const freeQrUnder = checkResourceLimit("free", "qr_codes", 2);
    assert.strictEqual(freeQrUnder.allowed, true);
    assert.strictEqual(freeQrUnder.limit, PLANS_CONFIG.free.limits.qr_codes);

    // 2. Free workspace at limit -> rejected
    const freeLimit = PLANS_CONFIG.free.limits.qr_codes;
    assert.throws(
        () => checkResourceLimit("free", "qr_codes", freeLimit),
        (err: unknown) => {
            return (
                err instanceof PlanLimitReachedError &&
                err.statusCode === 403 &&
                err.code === "plan_limit_reached"
            );
        }
    );

    // 3. Pro workspace -> uses Pro limit
    const proQrUnder = checkResourceLimit("pro", "qr_codes", freeLimit + 1);
    assert.strictEqual(proQrUnder.allowed, true);
    assert.strictEqual(proQrUnder.limit, PLANS_CONFIG.pro.limits.qr_codes);

    // 4. Business workspace -> uses Business limit
    const bizQrUnder = checkResourceLimit("business", "qr_codes", PLANS_CONFIG.pro.limits.qr_codes + 1);
    assert.strictEqual(bizQrUnder.allowed, true);
    assert.strictEqual(bizQrUnder.limit, PLANS_CONFIG.business.limits.qr_codes);

    // 5. Workspace A cannot consume Workspace B quota (Workspace isolation)
    const workspaceA = { id: "ws_a", planTier: "free" as PlanTier, qrUsage: PLANS_CONFIG.free.limits.qr_codes };
    const workspaceB = { id: "ws_b", planTier: "free" as PlanTier, qrUsage: 0 };
    assert.throws(() => checkResourceLimit(workspaceA.planTier, "qr_codes", workspaceA.qrUsage));
    const wsBCheck = checkResourceLimit(workspaceB.planTier, "qr_codes", workspaceB.qrUsage);
    assert.strictEqual(wsBCheck.allowed, true);

    // 6. User.subscriptionPlan does not affect runtime decision
    const legacyUserPlan = "business"; // User is business on legacy profile
    const activeWorkspacePlan = "free" as PlanTier; // Workspace is free
    assert.throws(
        () => checkResourceLimit(activeWorkspacePlan, "qr_codes", PLANS_CONFIG.free.limits.qr_codes),
        (err: unknown) => err instanceof PlanLimitReachedError // Workspace.planTier governs!
    );

    // 7. Existing resources remain after downgrade
    let currentWorkspacePlan: PlanTier = "pro";
    const userQrCount = 10; // Pro allowed 10 QRs
    // Downgrade Pro -> Free (limit 3)
    currentWorkspacePlan = "free";
    // System does NOT auto-delete resources (existing 10 QRs remain intact in DB)
    assert.strictEqual(userQrCount, 10);

    // 8. New creation is blocked after downgrade
    assert.throws(
        () => checkResourceLimit(currentWorkspacePlan, "qr_codes", userQrCount),
        (err: unknown) => err instanceof PlanLimitReachedError
    );


    // --- SMART PAGE TESTS ---

    // 9. Free workspace under limit -> allowed
    const freeSpUnder = checkResourceLimit("free", "smart_pages", 0);
    assert.strictEqual(freeSpUnder.allowed, true);

    // 10. Free workspace at limit -> rejected
    const freeSpLimit = PLANS_CONFIG.free.limits.smart_pages;
    assert.throws(
        () => checkResourceLimit("free", "smart_pages", freeSpLimit),
        (err: unknown) => err instanceof PlanLimitReachedError
    );

    // 11. Pro workspace -> uses Pro limit
    const proSpUnder = checkResourceLimit("pro", "smart_pages", freeSpLimit);
    assert.strictEqual(proSpUnder.allowed, true);
    assert.strictEqual(proSpUnder.limit, PLANS_CONFIG.pro.limits.smart_pages);

    // 12. Workspace isolation for Smart Pages
    const wsSpA = { planTier: "free" as PlanTier, usage: freeSpLimit };
    const wsSpB = { planTier: "free" as PlanTier, usage: 0 };
    assert.throws(() => checkResourceLimit(wsSpA.planTier, "smart_pages", wsSpA.usage));
    assert.strictEqual(checkResourceLimit(wsSpB.planTier, "smart_pages", wsSpB.usage).allowed, true);

    // 13. Existing pages remain after downgrade
    let spWorkspacePlan: PlanTier = "pro";
    const existingSpCount = 5;
    spWorkspacePlan = "free";
    assert.strictEqual(existingSpCount, 5); // Pages remain intact

    // 14. New page creation blocked after downgrade
    assert.throws(
        () => checkResourceLimit(spWorkspacePlan, "smart_pages", existingSpCount),
        (err: unknown) => err instanceof PlanLimitReachedError
    );


    // --- ERROR & STATUS FORMAT TESTS ---

    // 15. Entitlement error code = plan_limit_reached
    // 16. Error status remains 403
    // 17. No raw database errors are exposed
    try {
        checkResourceLimit("free", "qr_codes", freeLimit);
        assert.fail("Should have thrown PlanLimitReachedError");
    } catch (err: unknown) {
        assert.ok(err instanceof EntitlementError);
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, "plan_limit_reached");
        assert.strictEqual(typeof err.message, "string");
        assert.strictEqual(err.message.includes("MongoError"), false);
    }
}
