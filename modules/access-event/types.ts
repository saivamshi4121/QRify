import {
    AccessResultValue,
    AccessTypeValue,
} from "@/modules/access-event/constants";

export type PublicAccessEvent = {
    id: string;
    publicId: string;
    type: AccessTypeValue;
    result: AccessResultValue;
    gate: string;
    notes: string;
    deviceId: string | null;
    occurredAt: string;
    createdAt: string;
    attendee: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        ticketType: string;
    } | null;
    credential: {
        id: string;
        tokenVersion: number;
        status: string;
    } | null;
    operator: {
        name: string | null;
        email: string | null;
    } | null;
};

export type ValidateAccessResponse = {
    allowed: boolean;
    result: AccessResultValue;
    message: string;
    accessEvent: PublicAccessEvent;
    attendee: PublicAccessEvent["attendee"];
    credential: PublicAccessEvent["credential"];
    event: {
        id: string;
        name: string;
        slug: string;
        status: string;
    } | null;
    /** Present when result is ALREADY_ENTERED — time of the prior successful ENTRY. */
    previousEntryAt: string | null;
};
