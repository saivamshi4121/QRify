import crypto from "crypto";

export function generateWebhookPublicId(): string {
    return `wh_${crypto.randomBytes(6).toString("hex")}`;
}

export function generateDeliveryPublicId(): string {
    return `whd_${crypto.randomBytes(6).toString("hex")}`;
}

export function generateWebhookSecret(): string {
    return `whsec_${crypto.randomBytes(24).toString("base64url")}`;
}

export function secretPrefix(secret: string): string {
    return secret.slice(0, 12);
}

/**
 * HMAC-SHA256 over `${timestamp}.${rawBody}` using the endpoint secret.
 * Header value: `t=<unix>,v1=<hex>`
 */
export function signWebhookPayload(
    secret: string,
    timestampUnix: number,
    rawBody: string
): string {
    const signed = `${timestampUnix}.${rawBody}`;
    const digest = crypto
        .createHmac("sha256", secret)
        .update(signed, "utf8")
        .digest("hex");
    return `t=${timestampUnix},v1=${digest}`;
}

export function verifyWebhookSignature(input: {
    secret: string;
    signatureHeader: string;
    rawBody: string;
    toleranceSeconds?: number;
    nowSeconds?: number;
}): boolean {
    const parts = Object.fromEntries(
        input.signatureHeader.split(",").map((p) => {
            const [k, ...rest] = p.trim().split("=");
            return [k, rest.join("=")];
        })
    );
    const t = Number(parts.t);
    const v1 = parts.v1;
    if (!Number.isFinite(t) || !v1) return false;

    const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
    const tolerance = input.toleranceSeconds ?? 300;
    if (Math.abs(now - t) > tolerance) return false;

    const expected = signWebhookPayload(input.secret, t, input.rawBody);
    const expectedV1 = expected.split("v1=")[1];
    try {
        return crypto.timingSafeEqual(
            Buffer.from(v1, "utf8"),
            Buffer.from(expectedV1, "utf8")
        );
    } catch {
        return false;
    }
}
