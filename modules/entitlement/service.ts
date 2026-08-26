import dbConnect from "@/config/dbConnect";
import Workspace from "@/models/Workspace";
import QRCode from "@/models/QRCode";
import SmartPage from "@/models/SmartPage";
import Event from "@/models/Event";
import Attendee from "@/models/Attendee";
import ScannerDevice from "@/models/ScannerDevice";
import ApiKey from "@/models/ApiKey";
import WebhookEndpoint from "@/models/WebhookEndpoint";
import NotificationTemplate from "@/models/NotificationTemplate";

import { PLANS_CONFIG } from "@/config/plans.config";
import { DEFAULT_PLAN_TIER } from "./constants";
import {
    FeatureKey,
    PlanConfig,
    PlanTier,
    ResourceKey,
    EntitlementContext,
} from "./types";
import {
    FeatureNotAvailableError,
    PlanLimitReachedError,
} from "./errors";
import { BadRequestError, NotFoundError } from "@/core/errors/AppError";
import { isValidObjectId } from "mongoose";

/**
 * Retrieves the static plan configuration for a given plan tier.
 */
export function getPlanConfig(planTier: PlanTier): PlanConfig {
    return PLANS_CONFIG[planTier] || PLANS_CONFIG[DEFAULT_PLAN_TIER];
}

/**
 * Retrieves the plan tier of a workspace directly from Workspace.planTier (source of truth).
 */
export async function getWorkspacePlan(workspaceId: string): Promise<PlanTier> {
    if (!workspaceId || !isValidObjectId(workspaceId)) {
        throw new BadRequestError("Invalid or missing workspace ID");
    }

    await dbConnect();

    const workspace = await Workspace.findById(workspaceId).select("planTier").lean();
    if (!workspace) {
        throw new NotFoundError(`Workspace not found: ${workspaceId}`);
    }

    const planTier = (workspace.planTier as PlanTier) || DEFAULT_PLAN_TIER;
    return PLANS_CONFIG[planTier] ? planTier : DEFAULT_PLAN_TIER;
}

/**
 * Retrieves the numerical limit for a specific resource on a workspace.
 */
export async function getLimit(
    workspaceId: string,
    resource: ResourceKey
): Promise<number> {
    const planTier = await getWorkspacePlan(workspaceId);
    const config = getPlanConfig(planTier);
    return config.limits[resource] ?? 0;
}

/**
 * Calculates current active usage for a given resource within a workspace using MongoDB count queries.
 */
export async function getUsage(
    workspaceId: string,
    resource: ResourceKey,
    context?: EntitlementContext
): Promise<number> {
    if (!workspaceId || !isValidObjectId(workspaceId)) {
        throw new BadRequestError("Invalid or missing workspace ID");
    }

    await dbConnect();

    switch (resource) {
        case "qr_codes":
            return QRCode.countDocuments({ workspaceId, isActive: true });

        case "smart_pages":
            return SmartPage.countDocuments({ workspaceId });

        case "events":
            return Event.countDocuments({
                workspaceId,
                status: { $ne: "archived" },
            });

        case "attendees": {
            const query: Record<string, unknown> = { workspaceId };
            if (context?.eventId && isValidObjectId(context.eventId)) {
                query.eventId = context.eventId;
            }
            return Attendee.countDocuments(query);
        }

        case "scanner_devices": {
            const query: Record<string, unknown> = {
                workspaceId,
                status: { $ne: "disabled" },
            };
            if (context?.eventId && isValidObjectId(context.eventId)) {
                query.eventId = context.eventId;
            }
            return ScannerDevice.countDocuments(query);
        }

        case "api_keys":
            return ApiKey.countDocuments({ workspaceId, revokedAt: null });

        case "webhook_endpoints":
            return WebhookEndpoint.countDocuments({ workspaceId, enabled: true });

        case "notification_templates":
            return NotificationTemplate.countDocuments({ workspaceId });

        case "workspaces": {
            if (context?.userId && isValidObjectId(context.userId)) {
                return Workspace.countDocuments({ ownerId: context.userId });
            }
            return 1;
        }

        default:
            return 0;
    }
}

/**
 * Checks if a specific feature is enabled for a workspace.
 */
export async function canUseFeature(
    workspaceId: string,
    feature: FeatureKey
): Promise<boolean> {
    const planTier = await getWorkspacePlan(workspaceId);
    const config = getPlanConfig(planTier);
    return Boolean(config.features[feature]);
}

/**
 * Asserts that a feature is enabled for a workspace. Throws FeatureNotAvailableError if disabled.
 */
export async function assertFeature(
    workspaceId: string,
    feature: FeatureKey
): Promise<void> {
    const planTier = await getWorkspacePlan(workspaceId);
    const config = getPlanConfig(planTier);

    if (!config.features[feature]) {
        throw new FeatureNotAvailableError(
            `Feature '${feature}' is not available on the ${config.name} plan. Please upgrade to access this feature.`,
            {
                feature,
                currentPlan: planTier,
            }
        );
    }
}

/**
 * Asserts that current resource usage is strictly below the workspace plan limit.
 * Throws PlanLimitReachedError if usage >= limit.
 */
export async function assertWithinLimit(
    workspaceId: string,
    resource: ResourceKey,
    context?: EntitlementContext
): Promise<void> {
    const planTier = await getWorkspacePlan(workspaceId);
    const config = getPlanConfig(planTier);
    const limit = config.limits[resource] ?? 0;
    const currentUsage = await getUsage(workspaceId, resource, context);

    if (currentUsage >= limit) {
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
}
