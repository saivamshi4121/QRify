import crypto from "crypto";
import {
    ApiKeyEnvironment,
    ApiKeyEnvironmentValue,
} from "@/modules/api-key/constants";

export function generateApiKeyPublicId(): string {
    return `apk_${crypto.randomBytes(4).toString("hex")}`;
}

export function generateRawApiKey(
    environment: ApiKeyEnvironmentValue
): { rawKey: string; prefix: string } {
    const envPart =
        environment === ApiKeyEnvironment.LIVE ? "live" : "test";
    const secret = crypto.randomBytes(24).toString("base64url");
    const rawKey = `qz_${envPart}_${secret}`;
    const prefix = rawKey.slice(0, 12);
    return { rawKey, prefix };
}

export function hashApiKey(rawKey: string): string {
    const pepper =
        process.env.API_KEY_PEPPER ||
        process.env.NEXTAUTH_SECRET ||
        "qrezo-api-key-dev";
    return crypto
        .createHash("sha256")
        .update(`${rawKey}:${pepper}`)
        .digest("hex");
}

export function parseApiKeyEnvironment(
    rawKey: string
): ApiKeyEnvironmentValue | null {
    if (rawKey.startsWith("qz_live_")) return ApiKeyEnvironment.LIVE;
    if (rawKey.startsWith("qz_test_")) return ApiKeyEnvironment.TEST;
    return null;
}
