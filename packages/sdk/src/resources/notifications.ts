import type { HttpClient } from "../http";

export class TemplatesResource {
    constructor(private readonly http: HttpClient) {}

    list() {
        return this.http.get<unknown[]>("/api/v2/public/notifications");
    }

    get(templateId: string) {
        return this.http.get<unknown>(
            `/api/v2/public/notifications/${templateId}`
        );
    }

    create(input: Record<string, unknown>) {
        return this.http.post<unknown>("/api/v2/public/notifications", input);
    }

    update(templateId: string, input: Record<string, unknown>) {
        return this.http.patch<unknown>(
            `/api/v2/public/notifications/${templateId}`,
            input
        );
    }

    enable(templateId: string) {
        return this.update(templateId, { enabled: true });
    }

    disable(templateId: string) {
        return this.update(templateId, { enabled: false });
    }

    delete(templateId: string) {
        return this.http.delete<{ deleted: boolean }>(
            `/api/v2/public/notifications/${templateId}`
        );
    }
}

export class NotificationsResource {
    readonly templates: TemplatesResource;

    constructor(private readonly http: HttpClient) {
        this.templates = new TemplatesResource(http);
    }

    meta() {
        return this.http.get<unknown>("/api/v2/public/notifications?meta=1");
    }

    listDeliveries(params?: {
        templateId?: string;
        channel?: string;
        status?: string;
        triggerEvent?: string;
        q?: string;
        page?: number;
        limit?: number;
    }) {
        const qs = new URLSearchParams({ deliveries: "1" });
        if (params?.templateId) qs.set("templateId", params.templateId);
        if (params?.channel) qs.set("channel", params.channel);
        if (params?.status) qs.set("status", params.status);
        if (params?.triggerEvent) qs.set("triggerEvent", params.triggerEvent);
        if (params?.q) qs.set("q", params.q);
        if (params?.page != null) qs.set("page", String(params.page));
        if (params?.limit != null) qs.set("limit", String(params.limit));
        return this.http.get<unknown>(
            `/api/v2/public/notifications?${qs.toString()}`
        );
    }

    preview(input: {
        subject?: string;
        content: string;
        channel?: string;
        variables?: Record<string, unknown>;
    }) {
        return this.http.post<unknown>("/api/v2/public/notifications", {
            action: "preview",
            ...input,
        });
    }

    sendTest(input: {
        templateId: string;
        recipient: string;
        variables?: Record<string, unknown>;
    }) {
        return this.http.post<unknown>("/api/v2/public/notifications", {
            action: "test",
            ...input,
        });
    }

    retryDelivery(deliveryId: string) {
        return this.http.post<unknown>(
            `/api/v2/public/notifications/deliveries/${deliveryId}`,
            {}
        );
    }
}
