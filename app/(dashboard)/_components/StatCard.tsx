import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TrendDirection = "up" | "down" | "neutral";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    iconBg?: string;
    iconColor?: string;
    subText?: string;
    change?: number | null;
    trend?: TrendDirection;
    className?: string;
    gradient?: string;
}

function TrendBadge({ change }: { change: number }) {
    const isUp = change > 0;
    const isFlat = change === 0;
    return (
        <span
            className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold",
                isFlat ? "text-slate-400" : isUp ? "text-emerald-400" : "text-rose-400"
            )}
        >
            {!isFlat && (
                <span aria-hidden>{isUp ? "↑" : "↓"}</span>
            )}
            {isUp ? "+" : ""}{change}%
        </span>
    );
}

export function StatCard({
    title,
    value,
    icon,
    iconBg = "rgba(99,102,241,0.12)",
    iconColor = "#818cf8",
    subText,
    change,
    className,
    gradient,
}: StatCardProps) {
    const formatted =
        typeof value === "number" ? value.toLocaleString() : value;

    return (
        <div
            className={cn(
                "group relative rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px]",
                className
            )}
            style={{
                background: gradient || "linear-gradient(160deg, rgba(15,20,35,0.9) 0%, rgba(10,14,28,0.95) 100%)",
                border: "1px solid rgba(99,102,241,0.1)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(99,102,241,0.05)",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3), 0 0 24px rgba(99,102,241,0.08)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.1)";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(99,102,241,0.05)";
            }}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
                    <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-white">
                        {formatted}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        {change !== undefined && change !== null && (
                            <TrendBadge change={change} />
                        )}
                        {subText && !change && (
                            <span className="text-xs text-slate-500">{subText}</span>
                        )}
                    </div>
                </div>
                <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                    style={{
                        background: iconBg,
                        boxShadow: `0 0 20px ${iconBg}`,
                    }}
                >
                    <div style={{ color: iconColor }}>
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );
}
