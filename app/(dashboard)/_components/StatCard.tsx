import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    subText?: string;
    className?: string;
}

export function StatCard({ title, value, icon, subText, className }: StatCardProps) {
    return (
        <div className={cn("rounded-xl border border-slate-200 bg-white p-6 shadow-sm", className)}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <div className="mt-2 flex items-baseline">
                        <span className="text-3xl font-bold text-slate-900">{value}</span>
                        {subText && (
                            <span className="ml-2 text-sm text-slate-500">{subText}</span>
                        )}
                    </div>
                </div>
                <div className="rounded-full bg-slate-100 p-3 text-slate-600">
                    {icon}
                </div>
            </div>
        </div>
    );
}
