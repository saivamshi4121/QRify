import type { TemplateVariable } from "@/modules/notifications/constants";

const VAR_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

/** Escape HTML entities for email/HTML-safe rendering. */
export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Render `{{variable}}` placeholders.
 * Missing variables are replaced with empty string (fail gracefully).
 * When `escape` is true, values are HTML-escaped.
 */
export function renderTemplate(
    template: string,
    vars: Record<string, unknown>,
    options?: { escape?: boolean }
): string {
    const escape = options?.escape ?? false;
    return template.replace(VAR_RE, (_match, key: string) => {
        const raw = vars[key];
        if (raw === undefined || raw === null) return "";
        const str = String(raw);
        return escape ? escapeHtml(str) : str;
    });
}

export function extractTemplateVariables(template: string): string[] {
    const found = new Set<string>();
    let m: RegExpExecArray | null;
    const re = new RegExp(VAR_RE.source, "g");
    while ((m = re.exec(template)) !== null) {
        found.add(m[1]);
    }
    return [...found];
}

export function buildVariableMap(
    data: Record<string, unknown>
): Record<string, string> {
    const map: Record<string, string> = {};

    const pick = (key: TemplateVariable | string, ...paths: string[]) => {
        for (const p of paths) {
            const parts = p.split(".");
            let cur: unknown = data;
            for (const part of parts) {
                if (cur && typeof cur === "object" && part in (cur as object)) {
                    cur = (cur as Record<string, unknown>)[part];
                } else {
                    cur = undefined;
                    break;
                }
            }
            if (cur !== undefined && cur !== null && String(cur).length > 0) {
                map[key] = String(cur);
                return;
            }
        }
    };

    pick("firstName", "firstName", "attendee.firstName");
    pick("lastName", "lastName", "attendee.lastName");
    pick("email", "email", "attendee.email");
    pick("phone", "phone", "attendee.phone");
    pick("ticketType", "ticketType", "attendee.ticketType");
    pick("eventName", "eventName", "name", "event.name");
    pick("venue", "venue", "event.venue");
    pick("credentialUrl", "credentialUrl", "qrUrl");
    pick("qrUrl", "qrUrl", "credentialUrl");
    pick("checkInTime", "checkInTime", "accessEvent.occurredAt", "deliveredAt");

    const start =
        data.eventDate ??
        data.startDate ??
        (data.event as Record<string, unknown> | undefined)?.startDate;
    if (start) {
        try {
            map.eventDate = new Date(String(start)).toISOString();
        } catch {
            map.eventDate = String(start);
        }
    }

    const end =
        data.eventEndDate ??
        data.endDate ??
        (data.event as Record<string, unknown> | undefined)?.endDate;
    if (end) {
        try {
            map.eventEndDate = new Date(String(end)).toISOString();
        } catch {
            map.eventEndDate = String(end);
        }
    }

    // Flatten remaining string/number fields for custom templates
    for (const [k, v] of Object.entries(data)) {
        if (map[k] !== undefined) continue;
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
            map[k] = String(v);
        }
    }

    return map;
}
