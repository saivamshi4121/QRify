import type { HttpClient } from "../http";
import type { AccessValidateInput, ManualAccessInput } from "../types";

export class AccessResource {
    constructor(private readonly http: HttpClient) {}

    validate(eventId: string, input: AccessValidateInput) {
        return this.http.post<unknown>(
            `/api/v2/public/events/${eventId}/access/validate`,
            input
        );
    }

    entry(eventId: string, input: ManualAccessInput) {
        return this.http.post<unknown>(
            `/api/v2/public/events/${eventId}/access/entry`,
            input
        );
    }

    exit(eventId: string, input: ManualAccessInput) {
        return this.http.post<unknown>(
            `/api/v2/public/events/${eventId}/access/exit`,
            input
        );
    }
}
