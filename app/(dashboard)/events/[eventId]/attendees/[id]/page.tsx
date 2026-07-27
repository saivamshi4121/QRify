"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
    AttendeeForm,
    AttendeeFormValues,
} from "@/components/attendees/AttendeeForm";
import { CredentialPanel } from "@/components/attendees/CredentialPanel";
import { AccessHistoryPanel } from "@/components/attendees/AccessHistoryPanel";
import { RegistrationStatusValue } from "@/modules/attendee/constants";

export default function AttendeeDetailPage() {
    const params = useParams();
    const eventId = String(params.eventId);
    const publicId = String(params.id);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [values, setValues] = useState<AttendeeFormValues | null>(null);
    const [meta, setMeta] = useState<{
        source: string;
        createdAt: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/v2/events/${eventId}/attendees/${publicId}`
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Not found");
            const a = json.data;
            setValues({
                firstName: a.firstName,
                lastName: a.lastName,
                email: a.email,
                phone: a.phone || "",
                company: a.company || "",
                designation: a.designation || "",
                ticketType: a.ticketType,
                notes: a.notes || "",
                registrationStatus:
                    a.registrationStatus as RegistrationStatusValue,
            });
            setMeta({
                source: a.registrationSource,
                createdAt: a.createdAt,
            });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load");
            router.push(`/events/${eventId}/attendees`);
        } finally {
            setLoading(false);
        }
    }, [eventId, publicId, router]);

    useEffect(() => {
        if (session) load();
    }, [session, load]);

    async function handleSubmit() {
        if (!values) return;
        setSubmitting(true);
        try {
            const res = await fetch(
                `/api/v2/events/${eventId}/attendees/${publicId}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(values),
                }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Save failed");
            toast.success("Saved");
            setSubmitting(false);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Save failed");
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Delete this attendee? This cannot be undone.")) return;
        try {
            const res = await fetch(
                `/api/v2/events/${eventId}/attendees/${publicId}`,
                { method: "DELETE" }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Delete failed");
            toast.success("Deleted");
            router.push(`/events/${eventId}/attendees`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Delete failed");
        }
    }

    if (loading || !values) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <Toaster richColors position="top-right" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/events/${eventId}/attendees`}
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {values.firstName} {values.lastName}
                        </h1>
                        <p className="text-sm text-slate-500">
                            {publicId}
                            {meta
                                ? ` · ${meta.source} · ${new Date(meta.createdAt).toLocaleString()}`
                                : ""}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                    <Trash2 className="h-4 w-4" />
                    Delete
                </button>
            </div>
            <CredentialPanel eventId={eventId} attendeePublicId={publicId} />
            <AccessHistoryPanel
                eventId={eventId}
                attendeePublicId={publicId}
            />
            <AttendeeForm
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
                submitting={submitting}
                submitLabel="Save changes"
            />
        </div>
    );
}
