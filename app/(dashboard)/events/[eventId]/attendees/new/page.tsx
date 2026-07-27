"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
    AttendeeForm,
    AttendeeFormValues,
    DEFAULT_ATTENDEE_FORM,
} from "@/components/attendees/AttendeeForm";
import { RegistrationSource } from "@/modules/attendee/constants";

export default function NewAttendeePage() {
    const params = useParams();
    const eventId = String(params.eventId);
    const { status } = useSession();
    const router = useRouter();
    const [values, setValues] = useState<AttendeeFormValues>(DEFAULT_ATTENDEE_FORM);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    async function handleSubmit() {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/v2/events/${eventId}/attendees`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    registrationSource: RegistrationSource.MANUAL,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Create failed");
            toast.success("Attendee created");
            router.push(
                `/events/${eventId}/attendees/${json.data.publicId}`
            );
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
                    href={`/events/${eventId}/attendees`}
                    className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Add Attendee
                    </h1>
                    <p className="text-sm text-slate-500">
                        Register someone for this event.
                    </p>
                </div>
            </div>
            <AttendeeForm
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
                submitting={submitting}
                submitLabel="Add Attendee"
            />
        </div>
    );
}
