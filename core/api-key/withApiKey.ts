import { NextRequest, NextResponse } from "next/server";
import {
    ApiKeyScopeValue,
} from "@/modules/api-key/constants";
import {
    assertApiKeyScope,
    assertRateLimit,
    authenticateApiKey,
    logApiRequest,
} from "@/modules/api-key/service";
import type { ApiKeyContext } from "@/modules/api-key/types";
import { handlePublicApiError } from "@/core/errors/handlePublicApiError";
import { UnauthorizedError } from "@/core/errors/AppError";

function extractBearer(request: Request): string | null {
    const header = request.headers.get("authorization") || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || null;
}

/**
 * Authenticate API key → rate limit → permission check → handler → log.
 */
export async function withApiKey(
    request: NextRequest | Request,
    requiredScopes: ApiKeyScopeValue | ApiKeyScopeValue[],
    handler: (ctx: ApiKeyContext, request: Request) => Promise<NextResponse>
): Promise<NextResponse> {
    const started = Date.now();
    let ctx: ApiKeyContext | null = null;
    let response: NextResponse;
    let errorCode: string | null = null;

    try {
        const rawKey = extractBearer(request);
        if (!rawKey) {
            throw new UnauthorizedError(
                "Missing Authorization Bearer API key"
            );
        }

        ctx = await authenticateApiKey(rawKey);
        assertRateLimit(ctx);
        assertApiKeyScope(ctx, requiredScopes);
        response = await handler(ctx, request);
    } catch (error) {
        response = handlePublicApiError(error);
        if (error && typeof error === "object" && "code" in error) {
            errorCode = String((error as { code: string }).code);
        }
    }

    if (ctx) {
        const url = new URL(request.url);
        void logApiRequest({
            workspaceId: ctx.workspaceId,
            apiKeyId: ctx.apiKeyId,
            apiKeyPublicId: ctx.apiKeyPublicId,
            apiKeyName: ctx.name,
            method: request.method,
            endpoint: `${url.pathname}${url.search}`,
            statusCode: response.status,
            latencyMs: Date.now() - started,
            errorCode,
        });
    }

    return response;
}

export type { ApiKeyContext };
