import type { HttpClient } from "../http";
import type {
    CreateEventInput,
    Event,
    UpdateEventInput,
} from "../types";

export class EventsResource {
    constructor(private readonly http: HttpClient) {}

    list(params?: { q?: string; status?: string; sort?: string }) {
        const qs = new URLSearchParams();
        if (params?.q) qs.set("q", params.q);
        if (params?.status) qs.set("status", params.status);
        if (params?.sort) qs.set("sort", params.sort);
        const query = qs.toString();
        return this.http.get<Event[]>(
            `/api/v2/public/events${query ? `?${query}` : ""}`
        );
    }

    get(eventId: string) {
        return this.http.get<Event>(`/api/v2/public/events/${eventId}`);
    }

    create(input: CreateEventInput) {
        return this.http.post<Event>("/api/v2/public/events", {
            ...input,
            startDate:
                input.startDate instanceof Date
                    ? input.startDate.toISOString()
                    : input.startDate,
            endDate:
                input.endDate instanceof Date
                    ? input.endDate.toISOString()
                    : input.endDate,
        });
    }

    update(eventId: string, input: UpdateEventInput) {
        return this.http.patch<Event>(
            `/api/v2/public/events/${eventId}`,
            input
        );
    }

    delete(eventId: string) {
        return this.http.delete<{ deleted: boolean }>(
            `/api/v2/public/events/${eventId}`
        );
    }
}
