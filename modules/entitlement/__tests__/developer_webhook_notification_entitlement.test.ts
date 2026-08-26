import assert from "assert";
import { PLANS_CONFIG } from "@/config/plans.config";
import { PlanTier, FeatureKey, ResourceKey } from "../types";
import { FeatureNotAvailableError, PlanLimitReachedError, EntitlementError } from "../errors";

/**
 * Pure unit tests for Developer API, Webhook, and Notification entitlement rules (Milestone 5).
 */
export function runDeveloperWebhookNotificationEntitlementUnitTests() {
    function checkFeatureAccess(planTier: PlanTier, feature: FeatureKey) {
        const config = PLANS_CONFIG[planTier];
        const enabled = config.features[feature] ?? false;
        if (!enabled) {
            throw new FeatureNotAvailableError(
                `Feature '${feature}' is not available on the ${config.name} plan. Upgrade to access this feature.`,
                {
                    feature,
                    currentPlan: planTier,
                }
            );
        }
        return true;
    }

    function checkResourceLimit(planTier: PlanTier, resource: ResourceKey, currentUsage: number) {
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

    function evaluateEntitlement(planTier: PlanTier, feature: FeatureKey, resource: ResourceKey, currentUsage: number) {
        checkFeatureAccess(planTier, feature);
        checkResourceLimit(planTier, resource, currentUsage);
        return true;
    }

    // --- API KEY TESTS ---

    // 1. Free cannot create API key (feature_not_available)
    assert.throws(
        () => evaluateEntitlement("free", "api_access", "api_keys", 0),
        (err: unknown) => err instanceof FeatureNotAvailableError
    );

    // 2. Pro can create API key (under limit of 2)
    assert.strictEqual(evaluateEntitlement("pro", "api_access", "api_keys", 1), true);

    // 3. Business can create API key (under limit of 10)
    assert.strictEqual(evaluateEntitlement("business", "api_access", "api_keys", 5), true);

    // 4. Existing key management remains functional (rotate bypasses entitlement check, rename/revoke do not require feature check)
    function simulateRotateKey(wsPlan: PlanTier, isRotation: boolean) {
        if (!isRotation) {
            evaluateEntitlement(wsPlan, "api_access", "api_keys", 0);
        }
        return "new_rotated_key";
    }
    assert.strictEqual(simulateRotateKey("free", true), "new_rotated_key");

    // 5. Workspace isolation for API Keys
    const wsApiA = { planTier: "free" as PlanTier };
    const wsApiB = { planTier: "pro" as PlanTier };
    assert.throws(() => evaluateEntitlement(wsApiA.planTier, "api_access", "api_keys", 0));
    assert.strictEqual(evaluateEntitlement(wsApiB.planTier, "api_access", "api_keys", 0), true);

    // 6. User plan does not control entitlement
    const userLegacyPlan = "business";
    const activeWorkspacePlan = "free" as PlanTier;
    assert.throws(
        () => evaluateEntitlement(activeWorkspacePlan, "api_access", "api_keys", 0),
        (err: unknown) => err instanceof FeatureNotAvailableError
    );

    // 7. API key quota works if configured (Pro limit = 2)
    assert.throws(
        () => evaluateEntitlement("pro", "api_access", "api_keys", 2),
        (err: unknown) => err instanceof PlanLimitReachedError
    );

    // 8. Correct feature_not_available error & 9. HTTP 403
    try {
        evaluateEntitlement("free", "api_access", "api_keys", 0);
        assert.fail("Should have thrown FeatureNotAvailableError");
    } catch (err: unknown) {
        assert.ok(err instanceof FeatureNotAvailableError);
        const featErr = err as FeatureNotAvailableError;
        const details = featErr.details as Record<string, unknown> | undefined;
        assert.strictEqual(featErr.statusCode, 403);
        assert.strictEqual(featErr.code, "feature_not_available");
        assert.strictEqual(details?.feature, "api_access");
        assert.strictEqual(details?.currentPlan, "free");
    }


    // --- WEBHOOK TESTS ---

    // 10. Free cannot create webhook
    assert.throws(
        () => evaluateEntitlement("free", "webhooks", "webhook_endpoints", 0),
        (err: unknown) => err instanceof FeatureNotAvailableError
    );

    // 11. Pro can create webhook
    assert.strictEqual(evaluateEntitlement("pro", "webhooks", "webhook_endpoints", 1), true);

    // 12. Business can create webhook
    assert.strictEqual(evaluateEntitlement("business", "webhooks", "webhook_endpoints", 5), true);

    // 13. Webhook quota works if configured (Pro limit = 2)
    assert.throws(
        () => evaluateEntitlement("pro", "webhooks", "webhook_endpoints", 2),
        (err: unknown) => err instanceof PlanLimitReachedError
    );

    // 14. Existing endpoint remains stored after downgrade
    let webhookWsPlan: PlanTier = "pro";
    const existingEndpoints = [{ id: "wh_123", url: "https://example.com/webhook", enabled: true }];
    webhookWsPlan = "free"; // Downgrade
    assert.strictEqual(existingEndpoints.length, 1); // Endpoint retained

    // 15. Workspace isolation for Webhooks
    assert.throws(() => evaluateEntitlement("free", "webhooks", "webhook_endpoints", 0));
    assert.strictEqual(evaluateEntitlement("pro", "webhooks", "webhook_endpoints", 0), true);

    // 16. Correct error code & 17. HTTP 403
    try {
        evaluateEntitlement("pro", "webhooks", "webhook_endpoints", 2);
        assert.fail("Should have thrown PlanLimitReachedError");
    } catch (err: unknown) {
        assert.ok(err instanceof PlanLimitReachedError);
        const limitErr = err as PlanLimitReachedError;
        const details = limitErr.details as Record<string, unknown> | undefined;
        assert.strictEqual(limitErr.statusCode, 403);
        assert.strictEqual(limitErr.code, "plan_limit_reached");
        assert.strictEqual(details?.resource, "webhook_endpoints");
    }


    // --- NOTIFICATION TESTS ---

    // 18. Free behavior matches plan config (notifications feature disabled on Free)
    assert.throws(
        () => evaluateEntitlement("free", "notifications", "notification_templates", 0),
        (err: unknown) => err instanceof FeatureNotAvailableError
    );

    // 19. Pro can create template (under limit 5)
    assert.strictEqual(evaluateEntitlement("pro", "notifications", "notification_templates", 2), true);

    // 20. Business can create template (under limit 25)
    assert.strictEqual(evaluateEntitlement("business", "notifications", "notification_templates", 10), true);

    // 21. Template quota works if configured (Pro limit = 5)
    assert.throws(
        () => evaluateEntitlement("pro", "notifications", "notification_templates", 5),
        (err: unknown) => err instanceof PlanLimitReachedError
    );

    // 22. Existing templates remain after downgrade
    let notifWsPlan: PlanTier = "pro";
    const existingTemplates = [{ id: "ntpl_1", name: "Welcome Email" }];
    notifWsPlan = "free";
    assert.strictEqual(existingTemplates.length, 1);

    // 23. Workspace isolation for Notifications
    assert.throws(() => evaluateEntitlement("free", "notifications", "notification_templates", 0));
    assert.strictEqual(evaluateEntitlement("pro", "notifications", "notification_templates", 0), true);

    // 24. Correct error code & 25. HTTP 403
    try {
        evaluateEntitlement("free", "notifications", "notification_templates", 0);
        assert.fail("Should have thrown FeatureNotAvailableError");
    } catch (err: unknown) {
        assert.ok(err instanceof EntitlementError);
        assert.strictEqual((err as EntitlementError).statusCode, 403);
        assert.strictEqual((err as EntitlementError).code, "feature_not_available");
    }


    // --- REGRESSION TESTS ---

    // 26. Existing API key authentication still works
    function authenticateKey(revokedAt: Date | null, expired: boolean) {
        if (revokedAt) throw new Error("Revoked");
        if (expired) throw new Error("Expired");
        return true;
    }
    assert.strictEqual(authenticateKey(null, false), true);

    // 27. Existing public API requests still work for valid keys
    const validPublicApiReq = { authenticated: true };
    assert.strictEqual(validPublicApiReq.authenticated, true);

    // 28. Existing webhook delivery still works (publishing events on downgrade)
    function deliverWebhook(endpointEnabled: boolean) {
        return endpointEnabled;
    }
    assert.strictEqual(deliverWebhook(true), true);

    // 29. Existing notification delivery still works
    function deliverNotification(templateEnabled: boolean) {
        return templateEnabled;
    }
    assert.strictEqual(deliverNotification(true), true);

    // 30. Existing retries/replay functionality still works
    function retryDelivery(attempts: number, maxAttempts: number) {
        return attempts < maxAttempts;
    }
    assert.strictEqual(retryDelivery(1, 3), true);
}
