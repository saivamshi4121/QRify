import {
    CredentialStatusValue,
} from "@/modules/event-credential/constants";

export type PublicCredential = {
    id: string;
    publicId: string;
    status: CredentialStatusValue;
    tokenVersion: number;
    generatedAt: string;
    expiresAt: string | null;
    revokedAt: string | null;
    revokedReason: string | null;
    lastDownloadedAt: string | null;
    createdAt: string;
    updatedAt: string;
    /** Present only immediately after generate/regenerate. */
    token?: string;
};

export type ValidateCredentialResult = {
    valid: boolean;
    reason: string | null;
    credential: PublicCredential | null;
    attendee: {
        id: string;
        publicId: string;
        firstName: string;
        lastName: string;
        email: string;
        ticketType: string;
        registrationStatus: string;
    } | null;
    event: {
        id: string;
        name: string;
        slug: string;
        status: string;
        startDate: string;
        endDate: string;
        timezone: string;
        venue: string;
    } | null;
};

export type QrPayload = {
    /** Opaque content encoded into the QR (URL or token). */
    content: string;
};
