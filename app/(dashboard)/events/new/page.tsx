"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
    DEFAULT_EVENT_FORM,
    EventForm,
    EventFormValues,
    formValuesToPayload,
} from "@/components/events/EventForm";

export default function NewEventPage() {
    const { status } = useSession();
    const router = useRouter();
    const [values, setValues] = useState<EventFormValues>(DEFAULT_EVENT_FORM);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    async function handleSubmit() {
        setSubmitting(true);
        try {
            const payload = formValuesToPayload(values);
            if (!values.startDate || !values.endDate) {
                throw new Error("Start and end dates are required");
            }
            const res = await fetch("/api/v2/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Create failed");
            toast.success("Event created");
            router.push(`/events/${json.data._id}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Create failed");
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <Toaster richColors position="top-right" />
            <div className="flex items-center gap-3">
                <Link
                    href="/events"
                    className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Create Event
                    </h1>
                    <p className="text-sm text-slate-500">
                        Set up the basics. Ticketing comes in a later milestone.
                    </p>
                </div>
            </div>
            <EventForm
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
                submitting={submitting}
                submitLabel="Create Event"
            />
        </div>
    );
}
