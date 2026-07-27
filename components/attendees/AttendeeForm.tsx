"use client";

import {
    RegistrationStatus,
    RegistrationStatusValue,
} from "@/modules/attendee/constants";

export type AttendeeFormValues = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    designation: string;
    ticketType: string;
    notes: string;
    registrationStatus: RegistrationStatusValue;
};

export const DEFAULT_ATTENDEE_FORM: AttendeeFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    designation: "",
    ticketType: "General",
    notes: "",
    registrationStatus: RegistrationStatus.REGISTERED,
};

const inputClass =
    "mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400";

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

type AttendeeFormProps = {
    values: AttendeeFormValues;
    onChange: (next: AttendeeFormValues) => void;
    onSubmit: () => void;
    submitting?: boolean;
    submitLabel?: string;
};

export function AttendeeForm({
    values,
    onChange,
    onSubmit,
    submitting,
    submitLabel = "Save attendee",
}: AttendeeFormProps) {
    function patch(partial: Partial<AttendeeFormValues>) {
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
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="First Name">
                        <input
                            required
                            className={inputClass}
                            value={values.firstName}
                            onChange={(e) =>
                                patch({ firstName: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="Last Name">
                        <input
                            required
                            className={inputClass}
                            value={values.lastName}
                            onChange={(e) =>
                                patch({ lastName: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="Email">
                        <input
                            required
                            type="email"
                            className={inputClass}
                            value={values.email}
                            onChange={(e) => patch({ email: e.target.value })}
                        />
                    </Field>
                    <Field label="Phone" hint="Optional">
                        <input
                            className={inputClass}
                            value={values.phone}
                            onChange={(e) => patch({ phone: e.target.value })}
                            placeholder="+91…"
                        />
                    </Field>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                    Professional
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Company">
                        <input
                            className={inputClass}
                            value={values.company}
                            onChange={(e) => patch({ company: e.target.value })}
                        />
                    </Field>
                    <Field label="Designation">
                        <input
                            className={inputClass}
                            value={values.designation}
                            onChange={(e) =>
                                patch({ designation: e.target.value })
                            }
                        />
                    </Field>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                    Ticket
                </h2>
                <div className="mt-4 space-y-4">
                    <Field
                        label="Ticket Type"
                        hint="e.g. General, VIP, Speaker"
                    >
                        <input
                            required
                            className={inputClass}
                            value={values.ticketType}
                            onChange={(e) =>
                                patch({ ticketType: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="Status">
                        <select
                            className={inputClass}
                            value={values.registrationStatus}
                            onChange={(e) =>
                                patch({
                                    registrationStatus: e.target
                                        .value as RegistrationStatusValue,
                                })
                            }
                        >
                            <option value={RegistrationStatus.REGISTERED}>
                                Registered
                            </option>
                            <option value={RegistrationStatus.CANCELLED}>
                                Cancelled
                            </option>
                        </select>
                    </Field>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                    Internal
                </h2>
                <div className="mt-4">
                    <Field label="Notes" hint="Only visible to your team">
                        <textarea
                            className={inputClass}
                            rows={3}
                            value={values.notes}
                            onChange={(e) => patch({ notes: e.target.value })}
                        />
                    </Field>
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
