import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-lg bg-white/[0.06]",
                className
            )}
        />
    );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06]"
            style={{ background: "linear-gradient(160deg, rgba(15,20,35,0.9), rgba(10,14,28,0.95))" }}
        >
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="ml-auto h-8 w-20" />
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-white/[0.06]">
                        <tr>
                            {Array.from({ length: cols }).map((_, i) => (
                                <th key={i} className="px-5 py-3">
                                    <Skeleton className="h-3 w-16" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {Array.from({ length: rows }).map((_, r) => (
                            <tr key={r}>
                                {Array.from({ length: cols }).map((_, c) => (
                                    <td key={c} className="px-5 py-3.5">
                                        <Skeleton
                                            className={cn(
                                                "h-4",
                                                c === 0 ? "w-32" : c === cols - 1 ? "w-12" : "w-20"
                                            )}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.06]"
                    style={{ background: "linear-gradient(160deg, rgba(15,20,35,0.9), rgba(10,14,28,0.95))" }}
                >
                    <Skeleton className="h-28 w-full rounded-none" />
                    <div className="flex flex-col gap-3 p-5">
                        <div className="flex items-start justify-between">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3.5 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-2xl border border-white/[0.06] p-6"
                    style={{ background: "linear-gradient(160deg, rgba(15,20,35,0.9), rgba(10,14,28,0.95))" }}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-3">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-12 w-12 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}
