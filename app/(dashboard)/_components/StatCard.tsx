import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TrendDirection = "up" | "down" | "neutral";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    /** Icon background class, e.g. "bg-indigo-50" */
    iconBg?: string;
    subText?: string;
    /** Change percentage (positive/negative) */
    change?: number | null;
    trend?: TrendDirection;
    className?: string;
}

function TrendBadge({ change }: { change: number }) {
    const isUp = change > 0;
    const isFlat = change === 0;
    return (
        <span
            className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                isFlat ? "text-slate-400" : isUp ? "text-emerald-600" : "text-rose-600"
            )}
        >
            {!isFlat && (
                <span aria-hidden>{isUp ? "↑" : "↓"}</span>
            )}
            {isUp ? "+" : ""}{change}%
            <span className="font-normal text-slate-400 ml-1">vs prior</span>
        </span>
    );
}

export function StatCard({
    title,
    value,
    icon,
    iconBg = "bg-slate-100",
    subText,
    change,
    className,
}: StatCardProps) {
    const formatted =
        typeof value === "number" ? value.toLocaleString() : value;

    return (
        <div
            className={cn(
                "rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md",
                className
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
                        {formatted}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                        {change !== undefined && change !== null && (
                            <TrendBadge change={change} />
                        )}
                        {subText && !change && (
                            <span className="text-xs text-slate-400">{subText}</span>
                        )}
                    </div>
                </div>
                <div
                    className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        iconBg
                    )}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}
