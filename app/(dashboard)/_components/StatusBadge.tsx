import { cn } from "@/lib/utils";

type StatusVariant =
    | "active"
    | "inactive"
    | "draft"
    | "archived"
    | "online"
    | "offline"
    | "pairing"
    | "disabled"
    | "registered"
    | "cancelled"
    | "pending"
    | "live"
    | "completed"
    | string;

const VARIANT_MAP: Record<string, string> = {
    active:     "text-emerald-400",
    live:       "text-emerald-400",
    online:     "text-emerald-400",
    registered: "text-emerald-400",
    completed:  "text-blue-400",
    pairing:    "text-amber-400",
    pending:    "text-amber-400",
    draft:      "text-slate-400",
    inactive:   "text-slate-400",
    offline:    "text-slate-400",
    cancelled:  "text-rose-400",
    disabled:   "text-rose-400",
    archived:   "text-slate-500",
};

const BG_MAP: Record<string, string> = {
    active:     "rgba(52,211,153,0.1)",
    live:       "rgba(52,211,153,0.1)",
    online:     "rgba(52,211,153,0.1)",
    registered: "rgba(52,211,153,0.1)",
    completed:  "rgba(59,130,246,0.1)",
    pairing:    "rgba(245,158,11,0.1)",
    pending:    "rgba(245,158,11,0.1)",
    draft:      "rgba(148,163,184,0.08)",
    inactive:   "rgba(148,163,184,0.08)",
    offline:    "rgba(148,163,184,0.08)",
    cancelled:  "rgba(244,63,94,0.1)",
    disabled:   "rgba(244,63,94,0.1)",
    archived:   "rgba(148,163,184,0.06)",
};

const BORDER_MAP: Record<string, string> = {
    active:     "rgba(52,211,153,0.2)",
    live:       "rgba(52,211,153,0.2)",
    online:     "rgba(52,211,153,0.2)",
    registered: "rgba(52,211,153,0.2)",
    completed:  "rgba(59,130,246,0.2)",
    pairing:    "rgba(245,158,11,0.2)",
    pending:    "rgba(245,158,11,0.2)",
    draft:      "rgba(148,163,184,0.12)",
    inactive:   "rgba(148,163,184,0.12)",
    offline:    "rgba(148,163,184,0.12)",
    cancelled:  "rgba(244,63,94,0.2)",
    disabled:   "rgba(244,63,94,0.2)",
    archived:   "rgba(148,163,184,0.1)",
};

interface StatusBadgeProps {
    status: StatusVariant;
    dot?: boolean;
    className?: string;
}

export function StatusBadge({ status, dot, className }: StatusBadgeProps) {
    const normalized = status.toLowerCase();
    const colorClass = VARIANT_MAP[normalized] ?? "text-slate-400";
    const bg = BG_MAP[normalized] ?? "rgba(148,163,184,0.08)";
    const border = BORDER_MAP[normalized] ?? "rgba(148,163,184,0.12)";
    const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    if (dot) {
        const dotColor =
            normalized === "online" || normalized === "active" || normalized === "live" || normalized === "registered"
                ? "bg-emerald-400"
                : normalized === "pairing" || normalized === "pending"
                  ? "bg-amber-400"
                  : normalized === "disabled" || normalized === "cancelled"
                    ? "bg-rose-400"
                    : "bg-slate-500";

        return (
            <span className={cn("inline-flex items-center gap-1.5 text-xs text-slate-400", className)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
                {label}
            </span>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold",
                colorClass,
                className
            )}
            style={{
                background: bg,
                border: `1px solid ${border}`,
            }}
        >
            {label}
        </span>
    );
}
