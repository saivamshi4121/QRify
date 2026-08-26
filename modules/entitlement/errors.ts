import { AppError } from "@/core/errors/AppError";
import { ENTITLEMENT_ERROR_CODES, EntitlementErrorCode } from "./constants";

export class EntitlementError extends AppError {
    constructor(
        code: EntitlementErrorCode,
        message: string,
        details?: Record<string, unknown>
    ) {
        super(403, code, message, details);
        this.name = "EntitlementError";
    }
}

export class PlanLimitReachedError extends EntitlementError {
    constructor(
        message: string,
        details?: {
            resource: string;
            currentUsage: number;
            limit: number;
            currentPlan: string;
            requiredPlan?: string;
        }
    ) {
        super(ENTITLEMENT_ERROR_CODES.PLAN_LIMIT_REACHED, message, details);
        this.name = "PlanLimitReachedError";
    }
}

export class FeatureNotAvailableError extends EntitlementError {
    constructor(
        message: string,
        details?: {
            feature: string;
            currentPlan: string;
            requiredPlan?: string;
        }
    ) {
        super(ENTITLEMENT_ERROR_CODES.FEATURE_NOT_AVAILABLE, message, details);
        this.name = "FeatureNotAvailableError";
    }
}

export class PlanRequiredError extends EntitlementError {
    constructor(
        message: string,
        details?: {
            requiredPlan: string;
            currentPlan: string;
        }
    ) {
        super(ENTITLEMENT_ERROR_CODES.PLAN_REQUIRED, message, details);
        this.name = "PlanRequiredError";
    }
}
