import { PlanTier } from "./types";

export const PLAN_TIERS: Record<string, PlanTier> = {
    FREE: "free",
    PRO: "pro",
    BUSINESS: "business",
    ENTERPRISE: "enterprise",
};

export const DEFAULT_PLAN_TIER: PlanTier = "free";

export const ENTITLEMENT_ERROR_CODES = {
    PLAN_LIMIT_REACHED: "plan_limit_reached",
    FEATURE_NOT_AVAILABLE: "feature_not_available",
    PLAN_REQUIRED: "plan_required",
} as const;

export type EntitlementErrorCode =
    (typeof ENTITLEMENT_ERROR_CODES)[keyof typeof ENTITLEMENT_ERROR_CODES];
