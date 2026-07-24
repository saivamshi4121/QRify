"use client";

import { useMemo, useState } from "react";
import { RatingBlock } from "@/components/blocks/RatingBlock";
import {
    FeedbackFormBlock,
    FeedbackFormPayload,
} from "@/components/blocks/FeedbackFormBlock";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";

type BlockLike = {
    _id: string;
    blockType: string;
    title?: string;
    config: Record<string, unknown>;
    sortOrder: number;
    isVisible?: boolean;
};

type FeedbackFlowProps = {
    smartPageId: string;
    qrCodeId?: string | null;
    locationTag?: string | null;
    blocks: BlockLike[];
};

type Step = "rate" | "form" | "thanks";

export function FeedbackFlow({
    smartPageId,
    qrCodeId,
    locationTag,
    blocks,
}: FeedbackFlowProps) {
    const ratingBlock = useMemo(
        () => blocks.find((b) => b.blockType === "rating"),
        [blocks]
    );
    const formBlock = useMemo(
        () => blocks.find((b) => b.blockType === "feedback_form"),
        [blocks]
    );
    const googleBlock = useMemo(
        () => blocks.find((b) => b.blockType === "google_review"),
        [blocks]
    );
    const staticBlocks = useMemo(
        () =>
            blocks.filter(
                (b) =>
                    b.blockType === "header" ||
                    b.blockType === "text"
            ),
        [blocks]
    );

    const threshold = useMemo(() => {
        const raw = ratingBlock?.config?.negativeThreshold;
        const value = typeof raw === "number" ? raw : 4;
        return Math.min(Math.max(value, 1), 5);
    }, [ratingBlock]);

    const [step, setStep] = useState<Step>("rate");
    const [score, setScore] = useState<number | null>(null);
    const [responseId, setResponseId] = useState<string | null>(null);
    const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(null);
    const [googleButtonText, setGoogleButtonText] = useState("Leave a Google Review");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function persistRating(
        ratingScore: number,
        extras?: FeedbackFormPayload
    ) {
        const res = await fetch("/api/v2/feedback/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                smartPageId,
                qrCodeId: qrCodeId || undefined,
                ratingScore,
                locationTag: locationTag || undefined,
                ...extras,
            }),
        });
        const json = await res.json();
        if (!res.ok) {
            throw new Error(json.message || "Failed to save feedback");
        }
        return json.data as {
            responseId: string;
            routingResult: string;
            googleReviewUrl: string | null;
            googleButtonText: string;
        };
    }

    async function handleRate(nextScore: number) {
        if (busy) return;
        setError(null);
        setScore(nextScore);
        setBusy(true);
        try {
            if (nextScore >= threshold) {
                const data = await persistRating(nextScore);
                setResponseId(data.responseId);
                setGoogleReviewUrl(data.googleReviewUrl);
                setGoogleButtonText(data.googleButtonText || "Leave a Google Review");
                setStep("thanks");
            } else if (formBlock) {
                setStep("form");
            } else {
                const data = await persistRating(nextScore);
                setResponseId(data.responseId);
                setGoogleReviewUrl(null);
                setStep("thanks");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setScore(null);
        } finally {
            setBusy(false);
        }
    }

    async function handleFormSubmit(payload: FeedbackFormPayload) {
        if (score === null) return;
        const data = await persistRating(score, payload);
        setResponseId(data.responseId);
        setGoogleReviewUrl(null);
        setStep("thanks");
    }

    async function handleGoogleClick() {
        if (responseId) {
            try {
                await fetch("/api/v2/feedback/review-clicked", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ responseId }),
                });
            } catch {
                // Non-blocking — still open the review URL
            }
        }
        if (googleReviewUrl) {
            window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
        }
    }

    // Fallback: if no rating block, render all blocks statically
    if (!ratingBlock) {
        return (
            <div className="space-y-2 divide-y divide-slate-100">
                {blocks.map((block) => (
                    <BlockRenderer
                        key={block._id}
                        blockType={block.blockType}
                        config={block.config}
                        title={block.title}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2 divide-y divide-slate-100">
            {staticBlocks.map((block) => (
                <BlockRenderer
                    key={block._id}
                    blockType={block.blockType}
                    config={block.config}
                    title={block.title}
                />
            ))}

            <section className="py-4">
                {step === "rate" || step === "form" ? (
                    <RatingBlock
                        config={ratingBlock.config}
                        value={score}
                        onRate={step === "rate" ? handleRate : undefined}
                        disabled={busy || step === "form"}
                    />
                ) : null}

                {step === "form" && formBlock ? (
                    <div className="mt-6">
                        <FeedbackFormBlock
                            config={formBlock.config}
                            onSubmit={handleFormSubmit}
                        />
                    </div>
                ) : null}

                {step === "form" && !formBlock ? (
                    <p className="mt-4 text-center text-sm text-slate-500">
                        Thanks — a team member will follow up.
                    </p>
                ) : null}

                {step === "thanks" ? (
                    <div className="space-y-4 text-center py-4">
                        <h2 className="text-xl font-semibold text-slate-900">
                            Thank you!
                        </h2>
                        <p className="text-sm text-slate-600">
                            {score !== null && score >= threshold
                                ? "We appreciate your feedback."
                                : "We've received your feedback and will look into it."}
                        </p>
                        {score !== null &&
                        score >= threshold &&
                        googleReviewUrl ? (
                            <button
                                type="button"
                                onClick={handleGoogleClick}
                                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white"
                            >
                                {googleButtonText}
                            </button>
                        ) : null}
                        {score !== null &&
                        score >= threshold &&
                        !googleReviewUrl &&
                        googleBlock ? (
                            <p className="text-xs text-slate-400">
                                Google review link is not configured for this page.
                            </p>
                        ) : null}
                    </div>
                ) : null}

                {error ? (
                    <p className="mt-3 text-center text-sm text-red-500">{error}</p>
                ) : null}
            </section>
        </div>
    );
}
