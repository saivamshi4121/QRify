export type PlanTier = "free" | "pro" | "business" | "enterprise";

export type FeatureKey =
    | "custom_branding"
    | "api_access"
    | "webhooks"
    | "notifications"
    | "custom_domain"
    | "advanced_analytics"
    | "qrezo_connect";

export type ResourceKey =
    | "qr_codes"
    | "smart_pages"
    | "events"
    | "attendees"
    | "scanner_devices"
    | "api_keys"
    | "webhook_endpoints"
    | "notification_templates"
    | "workspaces";

export interface PlanLimits {
    qr_codes: number;
    smart_pages: number;
    events: number;
    attendees: number;
    scanner_devices: number;
    api_keys: number;
    webhook_endpoints: number;
    notification_templates: number;
    workspaces: number;
}

export interface PlanFeatures {
    custom_branding: boolean;
    api_access: boolean;
    webhooks: boolean;
    notifications: boolean;
    custom_domain: boolean;
    advanced_analytics: boolean;
    qrezo_connect: boolean;
}

export interface PlanConfig {
    name: string;
    description: string;
    tier: PlanTier;
    limits: PlanLimits;
    features: PlanFeatures;
}

export interface EntitlementContext {
    eventId?: string;
    userId?: string;
}
