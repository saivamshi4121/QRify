export const ApiKeyEnvironment = {
    TEST: "TEST",
    LIVE: "LIVE",
} as const;

export type ApiKeyEnvironmentValue =
    (typeof ApiKeyEnvironment)[keyof typeof ApiKeyEnvironment];

export const API_KEY_ENVIRONMENT_VALUES = Object.values(ApiKeyEnvironment);

/** Permission scopes — easy to extend. */
export const ApiKeyScope = {
    EVENTS_READ: "events:read",
    EVENTS_WRITE: "events:write",
    ATTENDEES_READ: "attendees:read",
    ATTENDEES_WRITE: "attendees:write",
    CREDENTIALS_READ: "credentials:read",
    CREDENTIALS_WRITE: "credentials:write",
    ACCESS_VALIDATE: "access:validate",
    ANALYTICS_READ: "analytics:read",
    WEBHOOKS_READ: "webhooks:read",
    WEBHOOKS_WRITE: "webhooks:write",
    NOTIFICATIONS_READ: "notifications:read",
    NOTIFICATIONS_WRITE: "notifications:write",
} as const;

export type ApiKeyScopeValue =
    (typeof ApiKeyScope)[keyof typeof ApiKeyScope];

export const API_KEY_SCOPE_VALUES = Object.values(ApiKeyScope);

export const DEFAULT_API_KEY_SCOPES: ApiKeyScopeValue[] = [
    ApiKeyScope.EVENTS_READ,
    ApiKeyScope.ATTENDEES_READ,
    ApiKeyScope.ATTENDEES_WRITE,
    ApiKeyScope.CREDENTIALS_READ,
    ApiKeyScope.CREDENTIALS_WRITE,
    ApiKeyScope.ACCESS_VALIDATE,
    ApiKeyScope.ANALYTICS_READ,
];

/** Soft rate limits per environment (requests / minute). */
export const RATE_LIMIT_PER_MINUTE: Record<ApiKeyEnvironmentValue, number> = {
    TEST: 60,
    LIVE: 300,
};

export const API_REQUEST_LOG_RETENTION = 500;
