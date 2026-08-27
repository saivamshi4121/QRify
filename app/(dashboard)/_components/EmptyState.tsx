import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] px-6 py-16 text-center",
                className
            )}
            style={{
                background: "linear-gradient(160deg, rgba(15,20,35,0.5) 0%, rgba(10,14,28,0.6) 100%)",
            }}
        >
            {icon && (
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{
                        background: "rgba(99,102,241,0.1)",
                        border: "1px solid rgba(99,102,241,0.15)",
                        color: "#818cf8",
                    }}
                >
                    {icon}
                </div>
            )}
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {description && (
                <p className="mt-2 max-w-sm text-sm text-slate-400">
                    {description}
                </p>
            )}
            {action && <div className="mt-6 flex gap-3">{action}</div>}
        </div>
    );
}
