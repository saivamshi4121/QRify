import type { HttpClient } from "../http";
import type { AnalyticsSection } from "../types";

export class AnalyticsResource {
    constructor(private readonly http: HttpClient) {}

    overview(eventId: string) {
        return this.get(eventId, "overview");
    }

    attendance(eventId: string) {
        return this.get(eventId, "attendance");
    }

    access(eventId: string) {
        return this.get(eventId, "access");
    }

    credentials(eventId: string) {
        return this.get(eventId, "credentials");
    }

    get(eventId: string, section: AnalyticsSection = "overview") {
        return this.http.get<unknown>(
            `/api/v2/public/events/${eventId}/analytics?section=${section}`
        );
    }
}
