import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    icon?: ReactNode;
}

export function SectionCard({ title, description, children, className, icon }: SectionCardProps) {
    return (
        <div className={cn("flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
            <div className="border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2">
                    {icon && <div className="text-indigo-600">{icon}</div>}
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                </div>
                {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}
