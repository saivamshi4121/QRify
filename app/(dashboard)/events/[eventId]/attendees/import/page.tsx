"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
    FieldKey,
    MAP_FIELDS,
    guessColumnMap,
    parseCsv,
} from "@/lib/attendee/csv";

type Step = 1 | 2 | 3 | 4;

type PreviewData = {
    total: number;
    valid: number;
    invalid: number;
    rows: Array<{
        index: number;
        valid: boolean;
        error?: string;
        data?: {
            firstName: string;
            lastName: string;
            email: string;
            ticketType: string;
        };
    }>;
};

export default function ImportAttendeesPage() {
    const params = useParams();
    const eventId = String(params.eventId);
    const { status } = useSession();
    const router = useRouter();

    const [step, setStep] = useState<Step>(1);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<string[][]>([]);
    const [columnMap, setColumnMap] = useState<Partial<Record<FieldKey, string>>>(
        {}
    );
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [busy, setBusy] = useState(false);
    const [importResult, setImportResult] = useState<{
        created: number;
        failed: number;
    } | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    const sampleRows = useMemo(() => rows.slice(0, 5), [rows]);

    function onFile(file: File) {
        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result || "");
            const parsed = parseCsv(text);
            if (parsed.headers.length === 0) {
                toast.error("Could not read CSV headers");
                return;
            }
            if (parsed.rows.length === 0) {
                toast.error("CSV has no data rows");
                return;
            }
            setHeaders(parsed.headers);
            setRows(parsed.rows);
            setColumnMap(guessColumnMap(parsed.headers));
            setPreview(null);
            setImportResult(null);
            setStep(2);
        };
        reader.readAsText(file);
    }

    async function runPreview() {
        if (!columnMap.email) {
            toast.error("Map the Email column");
            return;
        }
        setBusy(true);
        try {
            const res = await fetch(
                `/api/v2/events/${eventId}/attendees/import/preview`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        headers,
                        rows,
                        columnMap: {
                            email: columnMap.email,
                            firstName: columnMap.firstName || undefined,
                            lastName: columnMap.lastName || undefined,
                            name: columnMap.name || undefined,
                            phone: columnMap.phone || undefined,
                            company: columnMap.company || undefined,
                            designation: columnMap.designation || undefined,
                            ticketType: columnMap.ticketType || undefined,
                        },
                    }),
                }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Preview failed");
            setPreview(json.data);
            setStep(4);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Preview failed");
        } finally {
            setBusy(false);
        }
    }

    async function runImport() {
        if (!columnMap.email) return;
        setBusy(true);
        try {
            const res = await fetch(
                `/api/v2/events/${eventId}/attendees/import`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        headers,
                        rows,
                        columnMap: {
                            email: columnMap.email,
                            firstName: columnMap.firstName || undefined,
                            lastName: columnMap.lastName || undefined,
                            name: columnMap.name || undefined,
                            phone: columnMap.phone || undefined,
                            company: columnMap.company || undefined,
                            designation: columnMap.designation || undefined,
                            ticketType: columnMap.ticketType || undefined,
                        },
                    }),
                }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Import failed");
            setImportResult({
                created: json.data.created,
                failed: json.data.failed,
            });
            toast.success(`Imported ${json.data.created} attendee(s)`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Import failed");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <Toaster richColors position="top-right" />

            <div className="flex items-center gap-3">
                <Link
                    href={`/events/${eventId}/attendees`}
                    className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Import attendees
                    </h1>
                    <p className="text-sm text-slate-500">
                        Upload a CSV — no QR codes are generated.
                    </p>
                </div>
            </div>

            <ol className="flex flex-wrap gap-2 text-xs font-medium">
                {[
                    { n: 1, label: "Upload" },
                    { n: 2, label: "Preview" },
                    { n: 3, label: "Map columns" },
                    { n: 4, label: "Import" },
                ].map((s) => (
                    <li
                        key={s.n}
                        className={`rounded-full px-3 py-1 ${
                            step === s.n
                                ? "bg-indigo-600 text-white"
                                : step > s.n
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "bg-slate-100 text-slate-500"
                        }`}
                    >
                        {s.n}. {s.label}
                    </li>
                ))}
            </ol>

            {step === 1 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <p className="text-sm text-slate-600">
                        CSV columns can include Name, Email, Phone, Company,
                        Designation, Ticket.
                    </p>
                    <label className="mt-6 inline-flex cursor-pointer rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
                        Choose CSV file
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onFile(file);
                            }}
                        />
                    </label>
                </div>
            ) : null}

            {step === 2 ? (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm text-slate-600">
                        {rows.length} rows · {headers.length} columns
                    </p>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                            <thead className="border-b text-slate-500">
                                <tr>
                                    {headers.map((h) => (
                                        <th key={h} className="px-2 py-2 font-medium">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sampleRows.map((row, i) => (
                                    <tr key={i} className="border-b border-slate-50">
                                        {row.map((cell, j) => (
                                            <td
                                                key={j}
                                                className="max-w-[140px] truncate px-2 py-2 text-slate-700"
                                            >
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="rounded-md border border-slate-200 px-4 py-2 text-sm"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(3)}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white"
                        >
                            Map columns
                        </button>
                    </div>
                </div>
            ) : null}

            {step === 3 ? (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm text-slate-600">
                        Match your CSV headers to attendee fields. Email is
                        required. Use Full Name <em>or</em> First + Last.
                    </p>
                    <div className="space-y-3">
                        {MAP_FIELDS.map((field) => (
                            <label
                                key={field.key}
                                className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between"
                            >
                                <span className="font-medium text-slate-700">
                                    {field.label}
                                    {field.required ? " *" : ""}
                                </span>
                                <select
                                    className="rounded-md border border-slate-200 px-3 py-2 text-sm sm:w-56"
                                    value={columnMap[field.key] || ""}
                                    onChange={(e) =>
                                        setColumnMap((prev) => ({
                                            ...prev,
                                            [field.key]: e.target.value || undefined,
                                        }))
                                    }
                                >
                                    <option value="">— Skip —</option>
                                    {headers.map((h) => (
                                        <option key={h} value={h}>
                                            {h}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        ))}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="rounded-md border border-slate-200 px-4 py-2 text-sm"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={runPreview}
                            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-60"
                        >
                            {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : null}
                            Validate &amp; continue
                        </button>
                    </div>
                </div>
            ) : null}

            {step === 4 && preview ? (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap gap-4 text-sm">
                        <span>
                            Total: <strong>{preview.total}</strong>
                        </span>
                        <span className="text-emerald-700">
                            Valid: <strong>{preview.valid}</strong>
                        </span>
                        <span className="text-rose-600">
                            Invalid: <strong>{preview.invalid}</strong>
                        </span>
                    </div>

                    {preview.invalid > 0 ? (
                        <div className="max-h-40 overflow-y-auto rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs text-rose-800">
                            {preview.rows
                                .filter((r) => !r.valid)
                                .slice(0, 20)
                                .map((r) => (
                                    <p key={r.index}>
                                        Row {r.index + 2}: {r.error}
                                    </p>
                                ))}
                        </div>
                    ) : null}

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                            <thead className="border-b text-slate-500">
                                <tr>
                                    <th className="px-2 py-2">Name</th>
                                    <th className="px-2 py-2">Email</th>
                                    <th className="px-2 py-2">Ticket</th>
                                    <th className="px-2 py-2">OK</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.rows.slice(0, 10).map((r) => (
                                    <tr
                                        key={r.index}
                                        className="border-b border-slate-50"
                                    >
                                        <td className="px-2 py-2">
                                            {r.data
                                                ? `${r.data.firstName} ${r.data.lastName}`
                                                : "—"}
                                        </td>
                                        <td className="px-2 py-2">
                                            {r.data?.email || "—"}
                                        </td>
                                        <td className="px-2 py-2">
                                            {r.data?.ticketType || "—"}
                                        </td>
                                        <td className="px-2 py-2">
                                            {r.valid ? "Yes" : r.error}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {importResult ? (
                        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            Imported {importResult.created} attendee(s)
                            {importResult.failed
                                ? ` · ${importResult.failed} failed`
                                : ""}
                            .{" "}
                            <Link
                                href={`/events/${eventId}/attendees`}
                                className="font-medium underline"
                            >
                                View attendees
                            </Link>
                        </div>
                    ) : (
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="rounded-md border border-slate-200 px-4 py-2 text-sm"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                disabled={busy || preview.valid === 0}
                                onClick={runImport}
                                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-60"
                            >
                                {busy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : null}
                                Import {preview.valid} valid row
                                {preview.valid === 1 ? "" : "s"}
                            </button>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
