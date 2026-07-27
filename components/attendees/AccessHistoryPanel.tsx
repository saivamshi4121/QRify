"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";

type AccessRow = {
    id: string;
    type: string;
    result: string;
    gate: string;
    occurredAt: string;
    operator: { name: string | null; email: string | null } | null;
};

type AccessHistoryPanelProps = {
    eventId: string;
    attendeePublicId: string;
};

const resultStyles: Record<string, string> = {
    SUCCESS: "bg-emerald-50 text-emerald-700",
    ALREADY_ENTERED: "bg-amber-50 text-amber-800",
    DENIED: "bg-rose-50 text-rose-700",
    INVALID_CREDENTIAL: "bg-rose-50 text-rose-700",
    REVOKED_CREDENTIAL: "bg-rose-50 text-rose-700",
    EXPIRED_CREDENTIAL: "bg-rose-50 text-rose-700",
    EVENT_NOT_OPEN: "bg-slate-100 text-slate-600",
};

export function AccessHistoryPanel({
    eventId,
    attendeePublicId,
}: AccessHistoryPanelProps) {
    const [rows, setRows] = useState<AccessRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const base = `/api/v2/events/${eventId}/attendees/${attendeePublicId}/access`;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(base);
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to load");
            setRows(json.data || []);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, [base]);

    useEffect(() => {
        load();
    }, [load]);

    async function manual(kind: "entry" | "exit") {
        setBusy(true);
        try {
            const res = await fetch(`${base}/${kind}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gate: "Manual" }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed");
            toast.message(json.data.message || "Recorded", {
                description: json.data.result,
            });
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed");
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">
                        Access History
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Every check-in attempt is kept for audit — including
                        denials.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => manual("entry")}
                        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        <LogIn className="h-4 w-4" />
                        Manual Check-in
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => manual("exit")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        <LogOut className="h-4 w-4" />
                        Manual Check-out
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
            ) : rows.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No access events yet.
                </div>
            ) : (
                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-2 py-2 font-medium">Time</th>
                                <th className="px-2 py-2 font-medium">Gate</th>
                                <th className="px-2 py-2 font-medium">Type</th>
                                <th className="px-2 py-2 font-medium">Result</th>
                                <th className="px-2 py-2 font-medium">
                                    Operator
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    <td className="whitespace-nowrap px-2 py-2.5 text-xs text-slate-500">
                                        {new Date(
                                            row.occurredAt
                                        ).toLocaleString()}
                                    </td>
                                    <td className="px-2 py-2.5 text-slate-700">
                                        {row.gate}
                                    </td>
                                    <td className="px-2 py-2.5 text-slate-700">
                                        {row.type}
                                    </td>
                                    <td className="px-2 py-2.5">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                resultStyles[row.result] ||
                                                "bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                            {row.result}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2.5 text-slate-500">
                                        {row.operator?.name ||
                                            row.operator?.email ||
                                            "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
