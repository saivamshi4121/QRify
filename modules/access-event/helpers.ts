import crypto from "crypto";
import {
    AccessResult,
    AccessResultValue,
} from "@/modules/access-event/constants";

export function generateAccessPublicId(): string {
    return `acc_${crypto.randomBytes(4).toString("hex")}`;
}

export function mapCredentialReasonToResult(
    reason: string | null
): AccessResultValue {
    switch (reason) {
        case "CREDENTIAL_REVOKED":
            return AccessResult.REVOKED_CREDENTIAL;
        case "CREDENTIAL_EXPIRED":
            return AccessResult.EXPIRED_CREDENTIAL;
        case "CREDENTIAL_NOT_FOUND":
        case "CREDENTIAL_INACTIVE":
        case "ATTENDEE_CANCELLED":
            return AccessResult.INVALID_CREDENTIAL;
        default:
            return AccessResult.INVALID_CREDENTIAL;
    }
}

export function resultMessage(result: AccessResultValue): string {
    switch (result) {
        case AccessResult.SUCCESS:
            return "Access granted";
        case AccessResult.ALREADY_ENTERED:
            return "Attendee already checked in";
        case AccessResult.REVOKED_CREDENTIAL:
            return "Credential has been revoked";
        case AccessResult.EXPIRED_CREDENTIAL:
            return "Credential has expired";
        case AccessResult.EVENT_NOT_OPEN:
            return "Event is not open for check-in";
        case AccessResult.DENIED:
            return "Access denied";
        case AccessResult.INVALID_CREDENTIAL:
        default:
            return "Invalid credential";
    }
}
