import { HttpClient } from "./http";
import { AccessResource } from "./resources/access";
import { AnalyticsResource } from "./resources/analytics";
import { AttendeesResource } from "./resources/attendees";
import { CredentialsResource } from "./resources/credentials";
import { EventsResource } from "./resources/events";
import { NotificationsResource } from "./resources/notifications";
import type { QrezoClientOptions } from "./types";

/**
 * Qrezo Events public API client.
 */
export class Qrezo {
    readonly events: EventsResource;
    readonly attendees: AttendeesResource;
    readonly credentials: CredentialsResource;
    readonly access: AccessResource;
    readonly analytics: AnalyticsResource;
    readonly notifications: NotificationsResource;
    /** Alias for notifications.templates */
    readonly templates: NotificationsResource["templates"];

    constructor(options: QrezoClientOptions) {
        const http = new HttpClient(options);
        this.events = new EventsResource(http);
        this.attendees = new AttendeesResource(http);
        this.credentials = new CredentialsResource(http);
        this.access = new AccessResource(http);
        this.analytics = new AnalyticsResource(http);
        this.notifications = new NotificationsResource(http);
        this.templates = this.notifications.templates;
    }
}
