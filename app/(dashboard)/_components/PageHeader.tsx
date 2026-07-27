import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    /** Primary action(s) rendered to the right */
    actions?: ReactNode;
    /** Optional back button or breadcrumb element */
    back?: ReactNode;
    className?: string;
}

/**
 * Standardised page header used by every dashboard page.
 * Provides consistent title/desc spacing and an action slot.
 */
export function PageHeader({
    title,
    description,
    actions,
    back,
    className,
}: PageHeaderProps) {
    return (
        <div
            className={cn(
                "flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between",
                className
            )}
        >
            <div className="flex items-start gap-3">
                {back}
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-sm text-slate-500">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
