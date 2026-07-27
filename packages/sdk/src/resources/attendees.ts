import type { HttpClient } from "../http";
import type {
    Attendee,
    CreateAttendeeInput,
    ListAttendeesParams,
    UpdateAttendeeInput,
} from "../types";

export class AttendeesResource {
    constructor(private readonly http: HttpClient) {}

    list(eventId: string, params?: ListAttendeesParams) {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.status) qs.set("status", params.status);
        if (params?.ticketType) qs.set("ticketType", params.ticketType);
        if (params?.page != null) qs.set("page", String(params.page));
        if (params?.limit != null) qs.set("limit", String(params.limit));
        const query = qs.toString();
        return this.http.get<{
            items?: Attendee[];
            attendees?: Attendee[];
            pagination?: unknown;
            [key: string]: unknown;
        }>(
            `/api/v2/public/events/${eventId}/attendees${
                query ? `?${query}` : ""
            }`
        );
    }

    get(eventId: string, attendeeId: string) {
        return this.http.get<Attendee>(
            `/api/v2/public/events/${eventId}/attendees/${attendeeId}`
        );
    }

    create(eventId: string, input: CreateAttendeeInput) {
        return this.http.post<Attendee>(
            `/api/v2/public/events/${eventId}/attendees`,
            input
        );
    }

    update(eventId: string, attendeeId: string, input: UpdateAttendeeInput) {
        return this.http.patch<Attendee>(
            `/api/v2/public/events/${eventId}/attendees/${attendeeId}`,
            input
        );
    }

    delete(eventId: string, attendeeId: string) {
        return this.http.delete<{ deleted: boolean }>(
            `/api/v2/public/events/${eventId}/attendees/${attendeeId}`
        );
    }
}
