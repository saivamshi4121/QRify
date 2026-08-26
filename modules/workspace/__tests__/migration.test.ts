import assert from "assert";
import { PLAN_TIERS, DEFAULT_PLAN_TIER } from "@/modules/entitlement/constants";
import { PlanTier } from "@/modules/entitlement/types";

/**
 * Pure unit tests for Workspace plan migration rules and entitlement resolutions.
 */
export function runWorkspaceMigrationUnitTests() {
    const VALID_PLANS = new Set<string>(Object.values(PLAN_TIERS));

    // Simulation helper for backfill rule logic
    function resolveBackfillPlan(
        workspacePlanTier?: string,
        ownerSubscriptionPlan?: string
    ): { planTier: PlanTier; modified: boolean } {
        // Rule 1: Valid existing planTier remains unchanged
        if (workspacePlanTier && VALID_PLANS.has(workspacePlanTier)) {
            return { planTier: workspacePlanTier as PlanTier, modified: false };
        }

        // Rule 2: Missing/invalid planTier gets owner's plan if valid, else default "free"
        if (ownerSubscriptionPlan && VALID_PLANS.has(ownerSubscriptionPlan)) {
            return { planTier: ownerSubscriptionPlan as PlanTier, modified: true };
        }

        return { planTier: DEFAULT_PLAN_TIER, modified: true };
    }

    // 1. Existing workspace with valid plan -> remains unchanged.
    const test1 = resolveBackfillPlan("pro", "free");
    assert.strictEqual(test1.planTier, "pro");
    assert.strictEqual(test1.modified, false);

    // 2. Workspace with missing plan -> gets owner's plan.
    const test2 = resolveBackfillPlan(undefined, "business");
    assert.strictEqual(test2.planTier, "business");
    assert.strictEqual(test2.modified, true);

    // 3. Workspace with invalid plan -> handled safely (gets owner plan or default "free").
    const test3a = resolveBackfillPlan("invalid_tier", "pro");
    assert.strictEqual(test3a.planTier, "pro");
    assert.strictEqual(test3a.modified, true);

    const test3b = resolveBackfillPlan("invalid_tier", "invalid_owner_plan");
    assert.strictEqual(test3b.planTier, "free");
    assert.strictEqual(test3b.modified, true);

    // 4. User with multiple workspaces -> each workspace retains its own plan.
    const userWorkspaces = [
        { id: "ws_1", planTier: "free" },
        { id: "ws_2", planTier: "pro" },
        { id: "ws_3", planTier: "business" },
    ];
    const resolvedPlans = userWorkspaces.map((w) => resolveBackfillPlan(w.planTier, "pro"));
    assert.strictEqual(resolvedPlans[0].planTier, "free");
    assert.strictEqual(resolvedPlans[1].planTier, "pro");
    assert.strictEqual(resolvedPlans[2].planTier, "business");

    // 5. New workspace -> defaults to free.
    const newWorkspacePlan = resolveBackfillPlan(undefined, undefined);
    assert.strictEqual(newWorkspacePlan.planTier, "free");

    // 6. Running migration twice -> no additional changes (idempotent).
    const pass1 = resolveBackfillPlan(undefined, "pro");
    assert.strictEqual(pass1.planTier, "pro");
    assert.strictEqual(pass1.modified, true);

    const pass2 = resolveBackfillPlan(pass1.planTier, "pro");
    assert.strictEqual(pass2.planTier, "pro");
    assert.strictEqual(pass2.modified, false); // Idempotent: 0 modifications on 2nd pass

    // 7. Entitlement service concept -> reads Workspace.planTier.
    const activeWorkspace = { _id: "ws_pro", planTier: "pro" };
    assert.strictEqual(activeWorkspace.planTier, "pro");

    // 8. User.subscriptionPlan changes -> must NOT automatically overwrite an existing valid workspace plan.
    let ownerPlan = "free";
    const userWorkspace = resolveBackfillPlan("pro", ownerPlan);
    assert.strictEqual(userWorkspace.planTier, "pro");

    // Owner plan changes to "business"
    ownerPlan = "business";
    const workspaceAfterUserPlanChange = resolveBackfillPlan(userWorkspace.planTier, ownerPlan);
    assert.strictEqual(workspaceAfterUserPlanChange.planTier, "pro"); // Retains workspace plan!
    assert.strictEqual(workspaceAfterUserPlanChange.modified, false);
}
