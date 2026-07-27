import crypto from "crypto";
import dbConnect from "@/config/dbConnect";
import ApiKey from "@/models/ApiKey";
import ApiRequestLog from "@/models/ApiRequestLog";
import {
    AppError,
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
} from "@/core/errors/AppError";
import {
    ApiKeyEnvironmentValue,
    ApiKeyScopeValue,
    RATE_LIMIT_PER_MINUTE,
} from "@/modules/api-key/constants";
import {
    generateApiKeyPublicId,
    generateRawApiKey,
    hashApiKey,
    parseApiKeyEnvironment,
} from "@/modules/api-key/helpers";
import type {
    ApiKeyContext,
    CreatedApiKey,
    PublicApiKey,
    PublicApiRequestLog,
} from "@/modules/api-key/types";

async function uniquePublicId(): Promise<string> {
    for (let i = 0; i < 8; i++) {
        const publicId = generateApiKeyPublicId();
        const exists = await ApiKey.findOne({ publicId }).select("_id").lean();
        if (!exists) return publicId;
    }
    return `apk_${crypto.randomBytes(8).toString("hex")}`;
}

function toPublic(doc: {
    publicId: string;
    name: string;
    description?: string;
    keyPrefix: string;
    permissions: ApiKeyScopeValue[];
    environment: ApiKeyEnvironmentValue;
    lastUsedAt?: Date | null;
    expiresAt?: Date | null;
    revokedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}): PublicApiKey {
    return {
        id: doc.publicId,
        publicId: doc.publicId,
        name: doc.name,
        description: doc.description || "",
        keyPrefix: doc.keyPrefix,
        permissions: doc.permissions || [],
        environment: doc.environment,
        lastUsedAt: doc.lastUsedAt ? doc.lastUsedAt.toISOString() : null,
        expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
        revokedAt: doc.revokedAt ? doc.revokedAt.toISOString() : null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export async function createApiKey(input: {
    workspaceId: string;
    userId: string;
    name: string;
    description?: string;
    environment: ApiKeyEnvironmentValue;
    permissions: ApiKeyScopeValue[];
    expiresAt?: Date | null;
}): Promise<CreatedApiKey> {
    await dbConnect();
    const { rawKey, prefix } = generateRawApiKey(input.environment);
    const doc = await ApiKey.create({
        publicId: await uniquePublicId(),
        workspaceId: input.workspaceId,
        name: input.name,
        description: input.description || "",
        keyHash: hashApiKey(rawKey),
        keyPrefix: prefix,
        permissions: input.permissions,
        environment: input.environment,
        expiresAt: input.expiresAt ?? null,
        createdBy: input.userId,
    });
    return { ...toPublic(doc.toObject()), apiKey: rawKey };
}

export async function listApiKeys(
    workspaceId: string
): Promise<PublicApiKey[]> {
    await dbConnect();
    const docs = await ApiKey.find({ workspaceId })
        .sort({ createdAt: -1 })
        .lean();
    return docs.map((d) => toPublic(d));
}

export async function renameApiKey(input: {
    workspaceId: string;
    publicId: string;
    name?: string;
    description?: string;
    permissions?: ApiKeyScopeValue[];
    expiresAt?: Date | null;
}): Promise<PublicApiKey> {
    await dbConnect();
    const doc = await ApiKey.findOne({
        workspaceId: input.workspaceId,
        publicId: input.publicId,
    });
    if (!doc) throw new NotFoundError("API key not found");
    if (doc.revokedAt) throw new BadRequestError("Cannot edit a revoked key");
    if (input.name !== undefined) doc.name = input.name;
    if (input.description !== undefined) doc.description = input.description;
    if (input.permissions !== undefined) doc.permissions = input.permissions;
    if (input.expiresAt !== undefined) doc.expiresAt = input.expiresAt;
    await doc.save();
    return toPublic(doc.toObject());
}

export async function revokeApiKey(
    workspaceId: string,
    publicId: string
): Promise<PublicApiKey> {
    await dbConnect();
    const doc = await ApiKey.findOne({ workspaceId, publicId });
    if (!doc) throw new NotFoundError("API key not found");
    doc.revokedAt = new Date();
    await doc.save();
    return toPublic(doc.toObject());
}

export async function rotateApiKey(
    workspaceId: string,
    publicId: string,
    userId: string
): Promise<CreatedApiKey> {
    await dbConnect();
    const doc = await ApiKey.findOne({ workspaceId, publicId });
    if (!doc) throw new NotFoundError("API key not found");
    if (doc.revokedAt) throw new BadRequestError("Cannot rotate a revoked key");

    doc.revokedAt = new Date();
    await doc.save();

    return createApiKey({
        workspaceId,
        userId,
        name: doc.name,
        description: doc.description,
        environment: doc.environment,
        permissions: doc.permissions as ApiKeyScopeValue[],
        expiresAt: doc.expiresAt,
    });
}

export async function authenticateApiKey(
    rawKey: string
): Promise<ApiKeyContext> {
    await dbConnect();
    const env = parseApiKeyEnvironment(rawKey);
    if (!env) {
        throw new UnauthorizedError("Invalid API key format");
    }

    const keyHash = hashApiKey(rawKey);
    const doc = await ApiKey.findOne({ keyHash }).select("+keyHash");
    if (!doc) {
        throw new UnauthorizedError("Invalid API key");
    }
    if (doc.revokedAt) {
        throw new UnauthorizedError("API key has been revoked");
    }
    if (doc.expiresAt && doc.expiresAt.getTime() < Date.now()) {
        throw new UnauthorizedError("API key has expired");
    }
    if (doc.environment !== env) {
        throw new UnauthorizedError("API key environment mismatch");
    }

    // Fire-and-forget last used
    void ApiKey.updateOne(
        { _id: doc._id },
        { $set: { lastUsedAt: new Date() } }
    );

    return {
        apiKeyId: doc._id.toString(),
        apiKeyPublicId: doc.publicId,
        workspaceId: doc.workspaceId.toString(),
        environment: doc.environment,
        permissions: doc.permissions as ApiKeyScopeValue[],
        name: doc.name,
        createdByUserId: doc.createdBy.toString(),
    };
}

export function assertApiKeyScope(
    ctx: ApiKeyContext,
    required: ApiKeyScopeValue | ApiKeyScopeValue[]
) {
    const needed = Array.isArray(required) ? required : [required];
    const missing = needed.filter((s) => !ctx.permissions.includes(s));
    if (missing.length > 0) {
        throw new AppError(
            403,
            "permission_denied",
            `API key does not have ${missing.join(", ")} scope.`
        );
    }
}

/** In-memory sliding window rate limit per API key. */
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function assertRateLimit(ctx: ApiKeyContext) {
    const limit = RATE_LIMIT_PER_MINUTE[ctx.environment];
    const now = Date.now();
    const bucket = rateBuckets.get(ctx.apiKeyId);
    if (!bucket || bucket.resetAt <= now) {
        rateBuckets.set(ctx.apiKeyId, {
            count: 1,
            resetAt: now + 60_000,
        });
        return;
    }
    if (bucket.count >= limit) {
        throw new AppRateLimitError(
            `Rate limit exceeded (${limit} requests/minute for ${ctx.environment} keys).`
        );
    }
    bucket.count += 1;
}

export class AppRateLimitError extends Error {
    statusCode = 429;
    code = "rate_limit_exceeded";
    constructor(message: string) {
        super(message);
        this.name = "AppRateLimitError";
    }
}

export async function logApiRequest(input: {
    workspaceId: string;
    apiKeyId: string;
    apiKeyPublicId: string;
    apiKeyName: string;
    method: string;
    endpoint: string;
    statusCode: number;
    latencyMs: number;
    errorCode?: string | null;
}) {
    try {
        await dbConnect();
        await ApiRequestLog.create({
            publicId: `arl_${crypto.randomBytes(4).toString("hex")}`,
            workspaceId: input.workspaceId,
            apiKeyId: input.apiKeyId,
            apiKeyPublicId: input.apiKeyPublicId,
            apiKeyName: input.apiKeyName,
            method: input.method,
            endpoint: input.endpoint.slice(0, 300),
            statusCode: input.statusCode,
            latencyMs: input.latencyMs,
            errorCode: input.errorCode || null,
        });
    } catch {
        // Logging must never break the request
    }
}

export async function listApiRequestLogs(
    workspaceId: string,
    limit = 50
): Promise<PublicApiRequestLog[]> {
    await dbConnect();
    const docs = await ApiRequestLog.find({ workspaceId })
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, 100))
        .lean();
    return docs.map((d) => ({
        id: d.publicId,
        apiKeyPublicId: d.apiKeyPublicId,
        apiKeyName: d.apiKeyName,
        method: d.method,
        endpoint: d.endpoint,
        statusCode: d.statusCode,
        latencyMs: d.latencyMs,
        createdAt: d.createdAt.toISOString(),
    }));
}
