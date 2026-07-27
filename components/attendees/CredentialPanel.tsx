"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type PublicCredential = {
    id: string;
    publicId: string;
    status: "ACTIVE" | "REVOKED" | "EXPIRED";
    tokenVersion: number;
    generatedAt: string;
    expiresAt: string | null;
    revokedAt: string | null;
    revokedReason: string | null;
    lastDownloadedAt: string | null;
};

type CredentialPanelProps = {
    eventId: string;
    attendeePublicId: string;
};

const statusStyles: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    REVOKED: "bg-rose-50 text-rose-700",
    EXPIRED: "bg-amber-50 text-amber-800",
};

export function CredentialPanel({
    eventId,
    attendeePublicId,
}: CredentialPanelProps) {
    const [credential, setCredential] = useState<PublicCredential | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);
    const [showPreview, setShowPreview] = useState(false);

    const base = `/api/v2/events/${eventId}/attendees/${attendeePublicId}/credential`;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(base);
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to load");
            setCredential(json.data);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }, [base]);

    useEffect(() => {
        load();
    }, [load]);

    async function postAction(path: string, body?: object) {
        setBusy(true);
        try {
            const res = await fetch(`${base}${path}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: body ? JSON.stringify(body) : undefined,
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Action failed");
            setCredential(json.data);
            setPreviewKey((k) => k + 1);
            return true;
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Action failed");
            return false;
        } finally {
            setBusy(false);
        }
    }

    async function handleGenerate() {
        const ok = await postAction("");
        if (ok) {
            toast.success("Credential generated");
            setShowPreview(true);
        }
    }

    async function handleRegenerate() {
        if (
            !confirm(
                "Regenerate credential? The previous QR will stop working."
            )
        ) {
            return;
        }
        const ok = await postAction("/regenerate");
        if (ok) {
            toast.success("Credential regenerated");
            setShowPreview(true);
        }
    }

    async function handleRevoke() {
        if (!confirm("Revoke this credential? The QR will stop working.")) {
            return;
        }
        const ok = await postAction("/revoke", {
            reason: "Revoked by organizer",
        });
        if (ok) {
            toast.success("Credential revoked");
            setShowPreview(false);
        }
    }

    async function handleRestore() {
        const ok = await postAction("/restore");
        if (ok) {
            toast.success("Credential restored");
            setShowPreview(true);
        }
    }

    function download(format: "png" | "svg") {
        window.open(`${base}/${format}`, "_blank");
    }

    if (loading) {
        return (
            <div className="flex h-40 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">
                        Digital Credential
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Secure QR identity for this attendee. Scanning comes in a
                        later milestone.
                    </p>
                </div>
                {credential ? (
                    <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusStyles[credential.status] || statusStyles.REVOKED
                        }`}
                    >
                        {credential.status}
                    </span>
                ) : null}
            </div>

            {!credential ? (
                <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                    <p className="text-sm text-slate-600">
                        No credential yet for this attendee.
                    </p>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={handleGenerate}
                        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {busy ? "Generating…" : "Generate Credential"}
                    </button>
                </div>
            ) : (
                <div className="mt-6 space-y-5">
                    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                        <div>
                            <dt className="text-slate-500">Status</dt>
                            <dd className="mt-0.5 font-medium text-slate-900">
                                {credential.status}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Generated</dt>
                            <dd className="mt-0.5 font-medium text-slate-900">
                                {new Date(
                                    credential.generatedAt
                                ).toLocaleString()}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Token Version</dt>
                            <dd className="mt-0.5 font-medium text-slate-900">
                                v{credential.tokenVersion}
                            </dd>
                        </div>
                    </dl>

                    {credential.status === "ACTIVE" && showPreview ? (
                        <div className="flex justify-center rounded-lg border border-slate-100 bg-slate-50 p-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                key={previewKey}
                                src={`${base}/preview?t=${previewKey}`}
                                alt="Credential QR preview"
                                className="h-48 w-48 rounded-md bg-white p-2 shadow-sm"
                            />
                        </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                        {credential.status === "ACTIVE" ? (
                            <>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => setShowPreview((v) => !v)}
                                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    {showPreview ? "Hide Preview" : "Preview QR"}
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => download("png")}
                                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    Download PNG
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => download("svg")}
                                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    Download SVG
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={handleRegenerate}
                                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    Regenerate
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={handleRevoke}
                                    className="rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                                >
                                    Revoke
                                </button>
                            </>
                        ) : null}

                        {credential.status === "REVOKED" ? (
                            <>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={handleRestore}
                                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    Restore
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={handleRegenerate}
                                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    Generate new
                                </button>
                            </>
                        ) : null}

                        {credential.status === "EXPIRED" ? (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={handleRegenerate}
                                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                Generate new
                            </button>
                        ) : null}

                        {!credential ||
                        (credential.status !== "ACTIVE" &&
                            credential.status !== "REVOKED" &&
                            credential.status !== "EXPIRED") ? null : null}
                    </div>

                    {credential.revokedReason ? (
                        <p className="text-xs text-slate-400">
                            Reason: {credential.revokedReason}
                        </p>
                    ) : null}
                </div>
            )}
        </section>
    );
}
