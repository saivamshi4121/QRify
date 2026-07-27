export const RegistrationSource = {
    MANUAL: "MANUAL",
    CSV: "CSV",
    API: "API",
    SDK: "SDK",
} as const;

export type RegistrationSourceValue =
    (typeof RegistrationSource)[keyof typeof RegistrationSource];

export const REGISTRATION_SOURCE_VALUES = Object.values(RegistrationSource);

export const RegistrationStatus = {
    REGISTERED: "REGISTERED",
    CANCELLED: "CANCELLED",
} as const;

export type RegistrationStatusValue =
    (typeof RegistrationStatus)[keyof typeof RegistrationStatus];

export const REGISTRATION_STATUS_VALUES = Object.values(RegistrationStatus);

export const ATTENDEE_PAGE_SIZE_DEFAULT = 20;
export const ATTENDEE_PAGE_SIZE_MAX = 100;
