"use client";

import { useState } from "react";

type FeedbackFormConfig = {
    placeholder?: string;
    categories?: string[];
    requirePhone?: boolean;
};

export type FeedbackFormPayload = {
    category?: string;
    commentText?: string;
    customerName?: string;
    customerPhone?: string;
};

type FeedbackFormBlockProps = {
    config: Record<string, unknown>;
    onSubmit?: (payload: FeedbackFormPayload) => Promise<void> | void;
    disabled?: boolean;
};

export function FeedbackFormBlock({
    config,
    onSubmit,
    disabled = false,
}: FeedbackFormBlockProps) {
    const c = config as FeedbackFormConfig;
    const categories = c.categories?.length
        ? c.categories
        : ["Food", "Service", "Ambience"];

    const [category, setCategory] = useState(categories[0] || "");
    const [commentText, setCommentText] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!onSubmit || disabled) return;
        setError(null);
        setSubmitting(true);
        try {
            await onSubmit({
                category,
                commentText: commentText.trim(),
                customerName: customerName.trim() || undefined,
                customerPhone: customerPhone.trim() || undefined,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm font-medium text-slate-800">
                We&apos;re sorry — please tell us more
            </p>
            <select
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={disabled || submitting}
            >
                {categories.map((cat) => (
                    <option key={cat} value={cat}>
                        {cat}
                    </option>
                ))}
            </select>
            <textarea
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                rows={3}
                placeholder={c.placeholder || "Tell us what we can improve…"}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={disabled || submitting}
                required
            />
            <input
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                placeholder="Your name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={disabled || submitting}
            />
            {c.requirePhone ? (
                <input
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    placeholder="Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    disabled={disabled || submitting}
                    required
                />
            ) : null}
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <button
                type="submit"
                disabled={disabled || submitting}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
                {submitting ? "Sending…" : "Submit feedback"}
            </button>
        </form>
    );
}
