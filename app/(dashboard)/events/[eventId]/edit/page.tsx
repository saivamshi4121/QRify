"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
    EventForm,
    EventFormValues,
    formValuesToPayload,
    toDatetimeLocalValue,
} from "@/components/events/EventForm";
import { EventStatus } from "@/modules/event/constants";

export default function EditEventPage() {
    const params = useParams();
    const eventId = String(params.eventId);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [values, setValues] = useState<EventFormValues | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v2/events/${eventId}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Not found");
            const e = json.data;
            setValues({
                name: e.name || "",
                description: e.description || "",
                logo: e.logo || "",
                banner: e.banner || "",
                venue: e.venue || "",
                timezone: e.timezone || "UTC",
                startDate: toDatetimeLocalValue(e.startDate),
                endDate: toDatetimeLocalValue(e.endDate),
                status: e.status || EventStatus.DRAFT,
            });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to load");
            router.push("/events");
        } finally {
            setLoading(false);
        }
    }, [eventId, router]);

    useEffect(() => {
        if (session) load();
    }, [session, load]);

    async function handleSubmit() {
        if (!values) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/v2/events/${eventId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formValuesToPayload(values)),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Save failed");
            toast.success("Event saved");
            router.push(`/events/${eventId}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Save failed");
            setSubmitting(false);
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
            <div className="flex items-center gap-3">
                <Link
                    href={`/events/${eventId}`}
                    className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Edit Event
                    </h1>
                    <p className="text-sm text-slate-500">
                        Update details and publishing status.
                    </p>
                </div>
            </div>
            <EventForm
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
                submitting={submitting}
                submitLabel="Save changes"
            />
        </div>
    );
}
