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
    active:     "bg-emerald-50 text-emerald-700 ring-emerald-200",
    live:       "bg-emerald-50 text-emerald-700 ring-emerald-200",
    online:     "bg-emerald-50 text-emerald-700 ring-emerald-200",
    registered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    completed:  "bg-blue-50 text-blue-700 ring-blue-200",
    pairing:    "bg-amber-50 text-amber-700 ring-amber-200",
    pending:    "bg-amber-50 text-amber-700 ring-amber-200",
    draft:      "bg-slate-100 text-slate-600 ring-slate-200",
    inactive:   "bg-slate-100 text-slate-600 ring-slate-200",
    offline:    "bg-slate-100 text-slate-600 ring-slate-200",
    cancelled:  "bg-rose-50 text-rose-700 ring-rose-200",
    disabled:   "bg-rose-50 text-rose-700 ring-rose-200",
    archived:   "bg-slate-100 text-slate-500 ring-slate-200",
};

interface StatusBadgeProps {
    status: StatusVariant;
    /** Optional dot indicator instead of full pill */
    dot?: boolean;
    className?: string;
}

export function StatusBadge({ status, dot, className }: StatusBadgeProps) {
    const normalized = status.toLowerCase();
    const colorClass =
        VARIANT_MAP[normalized] ??
        "bg-slate-100 text-slate-600 ring-slate-200";
    const label = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    if (dot) {
        const dotColor =
            normalized === "online" || normalized === "active" || normalized === "live" || normalized === "registered"
                ? "bg-emerald-500"
                : normalized === "pairing" || normalized === "pending"
                  ? "bg-amber-500"
                  : normalized === "disabled" || normalized === "cancelled"
                    ? "bg-rose-500"
                    : "bg-slate-400";

        return (
            <span className={cn("inline-flex items-center gap-1.5 text-xs text-slate-700", className)}>
                <span className={cn("h-2 w-2 rounded-full", dotColor)} />
                {label}
            </span>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                colorClass,
                className
            )}
        >
            {label}
        </span>
    );
}
