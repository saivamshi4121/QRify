"use client";

import { EventStatus, EventStatusValue } from "@/modules/event/constants";

export type EventFormValues = {
    name: string;
    description: string;
    logo: string;
    banner: string;
    venue: string;
    timezone: string;
    startDate: string;
    endDate: string;
    status: EventStatusValue;
};

export const DEFAULT_EVENT_FORM: EventFormValues = {
    name: "",
    description: "",
    logo: "",
    banner: "",
    venue: "",
    timezone: "Asia/Kolkata",
    startDate: "",
    endDate: "",
    status: EventStatus.DRAFT,
};

const COMMON_TIMEZONES = [
    "UTC",
    "Asia/Kolkata",
    "America/New_York",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Dubai",
    "Asia/Singapore",
    "Australia/Sydney",
];

const inputClass =
    "mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400";

type EventFormProps = {
    values: EventFormValues;
    onChange: (next: EventFormValues) => void;
    onSubmit: () => void;
    submitting?: boolean;
    submitLabel?: string;
};

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block text-sm">
            <span className="font-medium text-slate-700">{label}</span>
            {children}
            {hint ? (
                <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>
            ) : null}
        </label>
    );
}

export function EventForm({
    values,
    onChange,
    onSubmit,
    submitting,
    submitLabel = "Save event",
}: EventFormProps) {
    function patch(partial: Partial<EventFormValues>) {
        onChange({ ...values, ...partial });
    }

    return (
        <form
            className="space-y-6"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
            }}
        >
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                    Basic Information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Name and description shown to your team.
                </p>
                <div className="mt-4 space-y-4">
                    <Field label="Event Name">
                        <input
                            required
                            className={inputClass}
                            value={values.name}
                            onChange={(e) => patch({ name: e.target.value })}
                            placeholder="e.g. Summer Food Festival 2026"
                        />
                    </Field>
                    <Field
                        label="Description"
                        hint="Optional. Keep it short for your team."
                    >
                        <textarea
                            className={inputClass}
                            rows={4}
                            value={values.description}
                            onChange={(e) =>
                                patch({ description: e.target.value })
                            }
                            placeholder="What is this event about?"
                        />
                    </Field>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                    Branding
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Paste image URLs for now. Upload support comes later.
                </p>
                <div className="mt-4 space-y-4">
                    <Field label="Logo URL">
                        <input
                            type="url"
                            className={inputClass}
                            value={values.logo}
                            onChange={(e) => patch({ logo: e.target.value })}
                            placeholder="https://…"
                        />
                    </Field>
                    <Field label="Banner URL">
                        <input
                            type="url"
                            className={inputClass}
                            value={values.banner}
                            onChange={(e) => patch({ banner: e.target.value })}
                            placeholder="https://…"
                        />
                    </Field>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                    Schedule
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Start Date">
                        <input
                            required
                            type="datetime-local"
                            className={inputClass}
                            value={values.startDate}
                            onChange={(e) =>
                                patch({ startDate: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="End Date">
                        <input
                            required
                            type="datetime-local"
                            className={inputClass}
                            value={values.endDate}
                            onChange={(e) => patch({ endDate: e.target.value })}
                        />
                    </Field>
                    <Field label="Timezone">
                        <select
                            required
                            className={inputClass}
                            value={values.timezone}
                            onChange={(e) =>
                                patch({ timezone: e.target.value })
                            }
                        >
                            {COMMON_TIMEZONES.map((tz) => (
                                <option key={tz} value={tz}>
                                    {tz}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                    Location
                </h2>
                <div className="mt-4">
                    <Field
                        label="Venue"
                        hint="Address or place name where the event happens."
                    >
                        <input
                            className={inputClass}
                            value={values.venue}
                            onChange={(e) => patch({ venue: e.target.value })}
                            placeholder="e.g. City Convention Center, Hall A"
                        />
                    </Field>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                    Publishing
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Draft stays internal. Publish marks the event as ready.
                </p>
                {values.status === EventStatus.ARCHIVED ||
                values.status === EventStatus.COMPLETED ? (
                    <p className="mt-4 text-sm text-slate-600">
                        Current status: <strong>{values.status}</strong>. Choose
                        Draft or Publish below to change it.
                    </p>
                ) : null}
                <div className="mt-4 flex gap-2 rounded-lg bg-slate-100 p-1">
                    {(
                        [
                            EventStatus.DRAFT,
                            EventStatus.PUBLISHED,
                        ] as const
                    ).map((status) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => patch({ status })}
                            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
                                values.status === status
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500"
                            }`}
                        >
                            {status === EventStatus.DRAFT ? "Draft" : "Publish"}
                        </button>
                    ))}
                </div>
            </section>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                    {submitting ? "Saving…" : submitLabel}
                </button>
            </div>
        </form>
    );
}

/** Convert API ISO dates to datetime-local value. */
export function toDatetimeLocalValue(iso: string | Date): string {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formValuesToPayload(values: EventFormValues) {
    return {
        name: values.name.trim(),
        description: values.description.trim(),
        logo: values.logo.trim(),
        banner: values.banner.trim(),
        venue: values.venue.trim(),
        timezone: values.timezone,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        status: values.status as EventStatusValue,
    };
}
