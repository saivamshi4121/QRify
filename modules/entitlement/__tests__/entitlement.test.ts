import assert from "assert";
import { getPlanConfig } from "../service";
import {
    EntitlementError,
    PlanLimitReachedError,
    FeatureNotAvailableError,
    PlanRequiredError,
} from "../errors";
import { ENTITLEMENT_ERROR_CODES } from "../constants";

export function runEntitlementTests() {
    // Test getPlanConfig
    const freeConfig = getPlanConfig("free");
    assert.strictEqual(freeConfig.tier, "free");
    assert.strictEqual(freeConfig.limits.qr_codes, 3);
    assert.strictEqual(freeConfig.features.custom_branding, false);

    const proConfig = getPlanConfig("pro");
    assert.strictEqual(proConfig.tier, "pro");
    assert.strictEqual(proConfig.limits.qr_codes, 50);
    assert.strictEqual(proConfig.features.custom_branding, true);

    const bizConfig = getPlanConfig("business");
    assert.strictEqual(bizConfig.tier, "business");
    assert.strictEqual(bizConfig.limits.qr_codes, 1000);

    const entConfig = getPlanConfig("enterprise");
    assert.strictEqual(entConfig.tier, "enterprise");
    assert.strictEqual(entConfig.limits.qr_codes, 1000000);

    // Test fallback
    // @ts-expect-error Invalid plan tier fallback test
    const fallbackConfig = getPlanConfig("invalid_plan");
    assert.strictEqual(fallbackConfig.tier, "free");

    // Test PlanLimitReachedError
    const limitErr = new PlanLimitReachedError("Limit reached", {
        resource: "qr_codes",
        currentUsage: 3,
        limit: 3,
        currentPlan: "free",
    });
    assert(limitErr instanceof EntitlementError);
    assert.strictEqual(limitErr.statusCode, 403);
    assert.strictEqual(limitErr.code, ENTITLEMENT_ERROR_CODES.PLAN_LIMIT_REACHED);

    // Test FeatureNotAvailableError
    const featureErr = new FeatureNotAvailableError("Feature not available", {
        feature: "api_access",
        currentPlan: "free",
    });
    assert(featureErr instanceof EntitlementError);
    assert.strictEqual(featureErr.statusCode, 403);
    assert.strictEqual(featureErr.code, ENTITLEMENT_ERROR_CODES.FEATURE_NOT_AVAILABLE);

    // Test PlanRequiredError
    const planRequiredErr = new PlanRequiredError("Pro plan required", {
        requiredPlan: "pro",
        currentPlan: "free",
    });
    assert(planRequiredErr instanceof EntitlementError);
    assert.strictEqual(planRequiredErr.statusCode, 403);
    assert.strictEqual(planRequiredErr.code, ENTITLEMENT_ERROR_CODES.PLAN_REQUIRED);
}
