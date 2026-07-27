import {
    ApiKeyEnvironmentValue,
    ApiKeyScopeValue,
} from "@/modules/api-key/constants";

export type PublicApiKey = {
    id: string;
    publicId: string;
    name: string;
    description: string;
    keyPrefix: string;
    permissions: ApiKeyScopeValue[];
    environment: ApiKeyEnvironmentValue;
    lastUsedAt: string | null;
    expiresAt: string | null;
    revokedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type CreatedApiKey = PublicApiKey & {
    /** Full key — only returned once at creation/rotation. */
    apiKey: string;
};

export type ApiKeyContext = {
    apiKeyId: string;
    apiKeyPublicId: string;
    workspaceId: string;
    environment: ApiKeyEnvironmentValue;
    permissions: ApiKeyScopeValue[];
    name: string;
    createdByUserId: string;
};

export type PublicApiRequestLog = {
    id: string;
    apiKeyPublicId: string;
    apiKeyName: string;
    method: string;
    endpoint: string;
    statusCode: number;
    latencyMs: number;
    createdAt: string;
};
