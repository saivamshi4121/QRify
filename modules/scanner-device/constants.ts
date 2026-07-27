export const ScannerDeviceStatus = {
    PAIRING: "PAIRING",
    ONLINE: "ONLINE",
    OFFLINE: "OFFLINE",
    DISABLED: "DISABLED",
} as const;

export type ScannerDeviceStatusValue =
    (typeof ScannerDeviceStatus)[keyof typeof ScannerDeviceStatus];

export const SCANNER_DEVICE_STATUS_VALUES = Object.values(ScannerDeviceStatus);

/** Pairing codes expire after 5 minutes. */
export const PAIRING_TTL_MS = 5 * 60 * 1000;

/** Consider a device ONLINE if lastSeen within this window. */
export const ONLINE_THRESHOLD_MS = 90 * 1000;

export const SCANNER_TOKEN_TTL = "30d";

export const SCANNER_APP_VERSION = "1.1.0";
