import type { HttpClient } from "../http";
import type { CredentialAction } from "../types";

export class CredentialsResource {
    constructor(private readonly http: HttpClient) {}

    get(eventId: string, attendeeId: string) {
        return this.http.get<unknown>(
            `/api/v2/public/events/${eventId}/attendees/${attendeeId}/credential`
        );
    }

    generate(
        eventId: string,
        attendeeId: string,
        options?: { expiresAt?: string | Date }
    ) {
        return this.action(eventId, attendeeId, "generate", {
            expiresAt:
                options?.expiresAt instanceof Date
                    ? options.expiresAt.toISOString()
                    : options?.expiresAt,
        });
    }

    regenerate(eventId: string, attendeeId: string) {
        return this.action(eventId, attendeeId, "regenerate");
    }

    revoke(eventId: string, attendeeId: string, reason?: string) {
        return this.action(eventId, attendeeId, "revoke", { reason });
    }

    restore(eventId: string, attendeeId: string) {
        return this.action(eventId, attendeeId, "restore");
    }

    /** Validate a credential token without event context. */
    validate(token: string) {
        return this.http.post<unknown>("/api/v2/public/credentials/validate", {
            token,
        });
    }

    private action(
        eventId: string,
        attendeeId: string,
        action: CredentialAction,
        extra?: Record<string, unknown>
    ) {
        return this.http.post<unknown>(
            `/api/v2/public/events/${eventId}/attendees/${attendeeId}/credential`,
            { action, ...extra }
        );
    }
}
