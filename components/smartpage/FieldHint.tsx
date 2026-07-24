"use client";

type FieldHintProps = {
    label: string;
    hint: string;
    children: React.ReactNode;
};

export function FieldHint({ label, hint, children }: FieldHintProps) {
    return (
        <label className="block text-sm">
            <span className="font-medium text-slate-700">{label}</span>
            <div className="mt-1">{children}</div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{hint}</p>
        </label>
    );
}

export const inputClass =
    "w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400";
