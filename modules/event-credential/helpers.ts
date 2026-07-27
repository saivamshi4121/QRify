import crypto from "crypto";
import { CREDENTIAL_TOKEN_BYTES } from "@/modules/event-credential/constants";

export function generateCredentialPublicId(): string {
    return `cred_${crypto.randomBytes(4).toString("hex")}`;
}

/** Long opaque hex token — never encodes PII or IDs. */
export function generateCredentialToken(): string {
    return crypto.randomBytes(CREDENTIAL_TOKEN_BYTES).toString("hex");
}

/**
 * QR payload is a validation URL containing only the opaque token.
 * Business data is never embedded in the code.
 */
export function buildQrPayload(token: string): string {
    const base =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";
    return `${base.replace(/\/$/, "")}/api/v2/credentials/validate?token=${encodeURIComponent(token)}`;
}
