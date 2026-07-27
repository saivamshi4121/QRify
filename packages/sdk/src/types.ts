export type QrezoClientOptions = {
    /** Full API key, e.g. qz_test_… or qz_live_… */
    apiKey: string;
    /** Origin of the Qrezo app, e.g. https://app.qrezo.com (no trailing slash) */
    baseUrl?: string;
    /** Optional fetch override (useful in tests / edge runtimes) */
    fetch?: typeof fetch;
};

export type Event = {
    id: string;
    name: string;
    slug: string;
    description: string;
    venue: string;
    timezone: string;
    startDate: string | null;
    endDate: string | null;
    status: string;
    createdAt: string | null;
    updatedAt: string | null;
};

export type CreateEventInput = {
    name: string;
    slug?: string;
    description?: string;
    venue?: string;
    timezone: string;
    startDate: string | Date;
    endDate: string | Date;
    status?: string;
    logo?: string;
    banner?: string;
};

export type UpdateEventInput = Partial<CreateEventInput>;

export type Attendee = {
    id: string;
    publicId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    ticketType?: string;
    status?: string;
    [key: string]: unknown;
};

export type CreateAttendeeInput = {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    ticketType: string;
    company?: string;
    notes?: string;
    customFields?: Record<string, unknown>;
    registrationSource?: string;
};

export type UpdateAttendeeInput = Partial<CreateAttendeeInput> & {
    status?: string;
};

export type ListAttendeesParams = {
    q?: string;
    status?: string;
    ticketType?: string;
    page?: number;
    limit?: number;
};

export type CredentialAction = "generate" | "regenerate" | "revoke" | "restore";

export type AccessValidateInput = {
    token: string;
    gate?: string;
    type?: "ENTRY" | "EXIT";
    deviceId?: string | null;
    notes?: string;
};

export type ManualAccessInput = {
    attendeeId: string;
    gate?: string;
    notes?: string;
    deviceId?: string | null;
};

export type AnalyticsSection =
    | "overview"
    | "attendance"
    | "access"
    | "credentials";
