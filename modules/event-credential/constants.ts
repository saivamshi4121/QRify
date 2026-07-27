export const CredentialStatus = {
    ACTIVE: "ACTIVE",
    REVOKED: "REVOKED",
    EXPIRED: "EXPIRED",
} as const;

export type CredentialStatusValue =
    (typeof CredentialStatus)[keyof typeof CredentialStatus];

export const CREDENTIAL_STATUS_VALUES = Object.values(CredentialStatus);

/** Bytes of randomness for opaque credential tokens (hex length = 2x). */
export const CREDENTIAL_TOKEN_BYTES = 32;
