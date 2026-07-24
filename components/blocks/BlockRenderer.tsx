"use client";

import type { ComponentType } from "react";
import { BlockType } from "@/modules/smartpage/constants";
import { HeaderBlock } from "@/components/blocks/HeaderBlock";
import { TextBlock } from "@/components/blocks/TextBlock";
import { RatingBlock } from "@/components/blocks/RatingBlock";
import { GoogleReviewBlock } from "@/components/blocks/GoogleReviewBlock";
import { FeedbackFormBlock } from "@/components/blocks/FeedbackFormBlock";

type BlockRendererProps = {
    blockType: string;
    config: Record<string, unknown>;
    title?: string;
};

const COMPONENT_MAP: Record<
    BlockType,
    ComponentType<{ config: Record<string, unknown> }>
> = {
    header: HeaderBlock,
    text: TextBlock,
    rating: RatingBlock,
    google_review: GoogleReviewBlock,
    feedback_form: FeedbackFormBlock,
};

/**
 * Maps blockType → React component. Registry stays metadata-only.
 */
export function BlockRenderer({ blockType, config, title }: BlockRendererProps) {
    const Component = COMPONENT_MAP[blockType as BlockType];

    if (!Component) {
        return (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-400">
                Unsupported block: {blockType}
            </div>
        );
    }

    return (
        <section className="py-4">
            {title && blockType !== "header" ? (
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {title}
                </h2>
            ) : null}
            <Component config={config || {}} />
        </section>
    );
}
