import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    icon?: ReactNode;
    action?: ReactNode;
}

export function SectionCard({ title, description, children, className, icon, action }: SectionCardProps) {
    return (
        <div
            className={cn(
                "flex flex-col rounded-2xl border border-white/[0.06] overflow-hidden",
                className
            )}
            style={{
                background: "linear-gradient(160deg, rgba(15,20,35,0.9) 0%, rgba(10,14,28,0.95) 100%)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            }}
        >
            <div className="border-b border-white/[0.06] px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        {icon && <div className="text-indigo-400">{icon}</div>}
                        <h3 className="text-base font-semibold text-white">{title}</h3>
                    </div>
                    {action && <div>{action}</div>}
                </div>
                {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}
