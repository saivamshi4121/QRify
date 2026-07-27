import { ScannerDeviceStatusValue } from "@/modules/scanner-device/constants";

export type PublicScannerDevice = {
    id: string;
    publicId: string;
    name: string;
    gate: string;
    status: ScannerDeviceStatusValue;
    pairedAt: string | null;
    lastSeen: string | null;
    lastScanAt: string | null;
    appVersion: string | null;
    operator: {
        name: string | null;
        email: string | null;
    } | null;
    pairingExpiresAt?: string | null;
};

export type PairingCreateResult = {
    device: PublicScannerDevice;
    pairingCode: string;
    pairingQr: string;
    expiresAt: string;
};

export type ScannerSessionPayload = {
    deviceId: string;
    workspaceId: string;
    eventId: string;
    gate: string;
    typ: "scanner";
};

export type ScannerSessionResponse = {
    token: string;
    device: PublicScannerDevice;
    workspace: { id: string; name: string };
    event: { id: string; name: string; status: string };
    gate: string;
};
