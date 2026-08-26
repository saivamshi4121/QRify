import dbConnect from "@/config/dbConnect";
import Workspace from "@/models/Workspace";
import User from "@/models/User";
import { PlanTier } from "@/modules/entitlement/types";
import { DEFAULT_PLAN_TIER, PLAN_TIERS } from "@/modules/entitlement/constants";

export interface MigrationResult {
    totalWorkspaces: number;
    updatedWorkspaces: number;
    unchangedWorkspaces: number;
    invalidPlanWorkspaces: number;
    errors: Array<{ workspaceId: string; error: string }>;
}

const VALID_PLANS: Set<string> = new Set(Object.values(PLAN_TIERS));

/**
 * Idempotent migration/backfill to ensure all Workspace documents have a valid planTier.
 *
 * Migration Rules:
 * 1. Inspect existing Workspace.planTier.
 * 2. If Workspace.planTier is already a valid PlanTier, DO NOT modify it.
 * 3. If Workspace.planTier is missing or invalid:
 *    - Lookup owner via Workspace.ownerId.
 *    - Read owner's User.subscriptionPlan.
 *    - If owner's plan is valid, initialize Workspace.planTier = owner.subscriptionPlan.
 *    - Otherwise, default to "free".
 * 4. Never overwrite an existing valid Workspace.planTier.
 * 5. Safe and idempotent to execute multiple times.
 */
export async function migrateWorkspacePlans(): Promise<MigrationResult> {
    await dbConnect();

    const workspaces = await Workspace.find({});
    const result: MigrationResult = {
        totalWorkspaces: workspaces.length,
        updatedWorkspaces: 0,
        unchangedWorkspaces: 0,
        invalidPlanWorkspaces: 0,
        errors: [],
    };

    for (const workspace of workspaces) {
        try {
            const currentPlan = workspace.planTier as string | undefined;

            // Rule 1: If planTier is already valid, preserve it (idempotency)
            if (currentPlan && VALID_PLANS.has(currentPlan)) {
                result.unchangedWorkspaces++;
                continue;
            }

            result.invalidPlanWorkspaces++;

            // Rule 2: Fallback to owner subscriptionPlan or DEFAULT_PLAN_TIER
            let targetPlan: PlanTier = DEFAULT_PLAN_TIER;
            if (workspace.ownerId) {
                const owner = await User.findById(workspace.ownerId).select("subscriptionPlan").lean();
                if (owner?.subscriptionPlan && VALID_PLANS.has(owner.subscriptionPlan)) {
                    targetPlan = owner.subscriptionPlan as PlanTier;
                }
            }

            workspace.planTier = targetPlan;
            await workspace.save();
            result.updatedWorkspaces++;
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            result.errors.push({
                workspaceId: workspace._id.toString(),
                error: errorMessage,
            });
        }
    }

    return result;
}
