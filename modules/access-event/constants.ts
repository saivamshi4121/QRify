export const AccessType = {
    ENTRY: "ENTRY",
    EXIT: "EXIT",
    CHECKPOINT: "CHECKPOINT",
} as const;

export type AccessTypeValue = (typeof AccessType)[keyof typeof AccessType];

export const ACCESS_TYPE_VALUES = Object.values(AccessType);

export const AccessResult = {
    SUCCESS: "SUCCESS",
    DENIED: "DENIED",
    ALREADY_ENTERED: "ALREADY_ENTERED",
    INVALID_CREDENTIAL: "INVALID_CREDENTIAL",
    REVOKED_CREDENTIAL: "REVOKED_CREDENTIAL",
    EXPIRED_CREDENTIAL: "EXPIRED_CREDENTIAL",
    EVENT_NOT_OPEN: "EVENT_NOT_OPEN",
} as const;

export type AccessResultValue =
    (typeof AccessResult)[keyof typeof AccessResult];

export const ACCESS_RESULT_VALUES = Object.values(AccessResult);

export const ACCESS_PAGE_SIZE_DEFAULT = 25;
export const ACCESS_PAGE_SIZE_MAX = 100;
