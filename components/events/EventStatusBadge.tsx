import { EventStatusValue } from "@/modules/event/constants";
import { cn } from "@/lib/utils";

const STYLES: Record<EventStatusValue, string> = {
    DRAFT: "bg-slate-100 text-slate-600",
    PUBLISHED: "bg-emerald-50 text-emerald-700",
    COMPLETED: "bg-blue-50 text-blue-700",
    ARCHIVED: "bg-amber-50 text-amber-800",
};

const LABELS: Record<EventStatusValue, string> = {
    DRAFT: "Draft",
    PUBLISHED: "Published",
    COMPLETED: "Completed",
    ARCHIVED: "Archived",
};

export function EventStatusBadge({ status }: { status: EventStatusValue }) {
    return (
        <span
            className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                STYLES[status] || STYLES.DRAFT
            )}
        >
            {LABELS[status] || status}
        </span>
    );
}

export function formatEventDateRange(
    startDate: string,
    endDate: string,
    timezone?: string
) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const opts: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    };
    const startStr = start.toLocaleString(undefined, opts);
    const endStr = end.toLocaleString(undefined, opts);
    return timezone ? `${startStr} – ${endStr} (${timezone})` : `${startStr} – ${endStr}`;
}
