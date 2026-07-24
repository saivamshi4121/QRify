"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { FieldHint, inputClass } from "@/components/smartpage/FieldHint";
import { BlockConfigForm } from "@/components/smartpage/BlockConfigForm";
import { REVIEW_SECTION_LABELS } from "@/components/smartpage/reviewPageLabels";
import { blockRegistry } from "@/modules/smartpage/blockRegistry";
import { BlockType } from "@/modules/smartpage/constants";
import type { EditorBlock } from "@/components/smartpage/BlockListEditor";

type BlockPatch = {
    config: Record<string, unknown>;
    title?: string;
    isVisible?: boolean;
};

type ReviewPageFormProps = {
    pageTitle: string;
    pageSlug: string;
    isPublished: boolean;
    blocks: EditorBlock[];
    busy?: boolean;
    onMetaChange: (partial: {
        title?: string;
        slug?: string;
        isPublished?: boolean;
    }) => void;
    onBlockChange: (blockId: string, next: BlockPatch) => void;
    onMove: (blockId: string, direction: "up" | "down") => void;
    onEnsureBlock: (blockType: BlockType) => Promise<EditorBlock | null>;
};

function findBlock(blocks: EditorBlock[], type: BlockType) {
    return blocks.find((b) => b.blockType === type) ?? null;
}

function str(config: Record<string, unknown>, key: string, fallback = "") {
    const v = config[key];
    return typeof v === "string" ? v : fallback;
}

function num(config: Record<string, unknown>, key: string, fallback: number) {
    const v = config[key];
    return typeof v === "number" ? v : fallback;
}

export function ReviewPageForm({
    pageTitle,
    pageSlug,
    isPublished,
    blocks,
    busy,
    onMetaChange,
    onBlockChange,
    onMove,
    onEnsureBlock,
}: ReviewPageFormProps) {
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [expertOpen, setExpertOpen] = useState(false);

    const header = findBlock(blocks, "header");
    const rating = findBlock(blocks, "rating");
    const google = findBlock(blocks, "google_review");
    const feedback = findBlock(blocks, "feedback_form");

    const restaurantName = header
        ? str(header.config, "title", pageTitle || "Welcome")
        : pageTitle;
    const logoUrl = header ? str(header.config, "logoUrl") : "";
    const welcome = header ? str(header.config, "subtitle") : "";
    const question = rating
        ? str(rating.config, "questionPrompt", "How was your experience today?")
        : "How was your experience today?";
    const threshold = rating ? num(rating.config, "negativeThreshold", 4) : 4;
    const reviewUrl = google ? str(google.config, "customReviewUrl") : "";
    const privateFeedbackOn = feedback ? feedback.isVisible !== false : false;

    function patchHeader(partial: Record<string, unknown>) {
        if (!header) return;
        onBlockChange(header._id, {
            config: { ...header.config, ...partial },
            title: header.title,
            isVisible: header.isVisible,
        });
    }

    function patchRating(partial: Record<string, unknown>) {
        if (!rating) return;
        onBlockChange(rating._id, {
            config: { ...rating.config, ...partial },
            title: rating.title,
            isVisible: rating.isVisible,
        });
    }

    function patchGoogle(partial: Record<string, unknown>) {
        if (!google) return;
        onBlockChange(google._id, {
            config: { ...google.config, ...partial },
            title: google.title,
            isVisible: google.isVisible !== false,
        });
    }

    async function handleRestaurantName(value: string) {
        onMetaChange({ title: value });
        if (header) {
            patchHeader({ title: value });
        } else {
            const created = await onEnsureBlock("header");
            if (created) {
                onBlockChange(created._id, {
                    config: { ...created.config, title: value },
                    title: created.title,
                    isVisible: created.isVisible,
                });
            }
        }
    }

    async function handlePrivateFeedbackToggle(enabled: boolean) {
        if (feedback) {
            onBlockChange(feedback._id, {
                config: feedback.config,
                title: feedback.title,
                isVisible: enabled,
            });
            return;
        }
        if (enabled) {
            const created = await onEnsureBlock("feedback_form");
            if (created) {
                onBlockChange(created._id, {
                    config: created.config,
                    title: created.title,
                    isVisible: true,
                });
            }
        }
    }

    async function ensureAndPatch(
        type: BlockType,
        existing: EditorBlock | null,
        partial: Record<string, unknown>
    ) {
        if (existing) {
            onBlockChange(existing._id, {
                config: { ...existing.config, ...partial },
                title: existing.title,
                isVisible: existing.isVisible,
            });
            return;
        }
        const created = await onEnsureBlock(type);
        if (created) {
            onBlockChange(created._id, {
                config: { ...created.config, ...partial },
                title: created.title,
                isVisible: created.isVisible,
            });
        }
    }

    const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div className="space-y-6">
            {/* Status in form for mobile; desktop also has header control */}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 xl:hidden">
                <div>
                    <p className="text-sm font-medium text-slate-700">Status</p>
                    <p className="text-xs text-slate-400">
                        Draft stays private. Live is visible to guests.
                    </p>
                </div>
                <select
                    className={inputClass + " w-auto"}
                    value={isPublished ? "live" : "draft"}
                    onChange={(e) =>
                        onMetaChange({ isPublished: e.target.value === "live" })
                    }
                >
                    <option value="draft">Draft</option>
                    <option value="live">Live</option>
                </select>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                    Restaurant Information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    What guests see at the top of your page.
                </p>
                <div className="mt-4 space-y-4">
                    <FieldHint
                        label="Restaurant Name"
                        hint="Shown at the top of the page."
                    >
                        <input
                            className={inputClass}
                            value={restaurantName}
                            onChange={(e) => handleRestaurantName(e.target.value)}
                            placeholder="e.g. Bella Trattoria"
                        />
                    </FieldHint>
                    <FieldHint
                        label="Logo"
                        hint="Optional. Paste an image link — appears above your name."
                    >
                        <input
                            className={inputClass}
                            value={logoUrl}
                            onChange={(e) =>
                                ensureAndPatch("header", header, {
                                    logoUrl: e.target.value,
                                })
                            }
                            placeholder="https://…"
                        />
                    </FieldHint>
                    <FieldHint
                        label="Welcome Message"
                        hint="A short hello for guests after they scan."
                    >
                        <input
                            className={inputClass}
                            value={welcome}
                            onChange={(e) =>
                                ensureAndPatch("header", header, {
                                    subtitle: e.target.value,
                                })
                            }
                            placeholder="Thanks for dining with us!"
                        />
                    </FieldHint>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                    Customer Experience
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    How happy guests leave a public review vs private feedback.
                </p>
                <div className="mt-4 space-y-4">
                    <FieldHint
                        label="Rating question"
                        hint="Asked before they pick stars."
                    >
                        <input
                            className={inputClass}
                            value={question}
                            onChange={(e) =>
                                ensureAndPatch("rating", rating, {
                                    questionPrompt: e.target.value,
                                })
                            }
                        />
                    </FieldHint>
                    <FieldHint
                        label="Rating Threshold"
                        hint="4 or 5 stars → Google review. Lower scores → private feedback."
                    >
                        <select
                            className={inputClass}
                            value={threshold}
                            onChange={(e) =>
                                ensureAndPatch("rating", rating, {
                                    negativeThreshold: Number(e.target.value),
                                })
                            }
                        >
                            {[5, 4, 3].map((n) => (
                                <option key={n} value={n}>
                                    {n}+ stars go to Google
                                </option>
                            ))}
                        </select>
                    </FieldHint>
                    <FieldHint
                        label="Google Review Link"
                        hint="Customers who give 4 or 5 stars will be sent here."
                    >
                        <input
                            className={inputClass}
                            value={reviewUrl}
                            onChange={(e) =>
                                ensureAndPatch("google_review", google, {
                                    customReviewUrl: e.target.value,
                                })
                            }
                            placeholder="https://g.page/r/…"
                        />
                    </FieldHint>
                    <div>
                        <label className="flex items-start gap-3 text-sm">
                            <input
                                type="checkbox"
                                className="mt-1"
                                checked={privateFeedbackOn}
                                disabled={busy}
                                onChange={(e) =>
                                    handlePrivateFeedbackToggle(e.target.checked)
                                }
                            />
                            <span>
                                <span className="font-medium text-slate-700">
                                    Enable Private Feedback
                                </span>
                                <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                                    Collect comments from guests who rate below
                                    the threshold — only you see these.
                                </span>
                            </span>
                        </label>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <button
                    type="button"
                    onClick={() => setAdvancedOpen((v) => !v)}
                    className="flex w-full items-center gap-2 px-5 py-4 text-left"
                >
                    {advancedOpen ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            Advanced Settings
                        </p>
                        <p className="text-xs text-slate-400">
                            Public link, page order, and expert options
                        </p>
                    </div>
                </button>

                {advancedOpen ? (
                    <div className="space-y-5 border-t border-slate-100 px-5 py-4">
                        <FieldHint
                            label="Public Link"
                            hint="Share this URL or link a QR code to it."
                        >
                            <div className="flex items-center gap-2">
                                <span className="shrink-0 text-xs text-slate-400">
                                    /p/
                                </span>
                                <input
                                    className={inputClass}
                                    value={pageSlug}
                                    onChange={(e) =>
                                        onMetaChange({
                                            slug: e.target.value
                                                .toLowerCase()
                                                .replace(/[^a-z0-9-]/g, "-"),
                                        })
                                    }
                                />
                            </div>
                        </FieldHint>

                        <div>
                            <p className="text-sm font-medium text-slate-700">
                                Page order
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Change only if the phone preview looks wrong.
                            </p>
                            <ul className="mt-3 space-y-2">
                                {sorted.map((block, index) => {
                                    const label =
                                        (blockRegistry.isRegistered(
                                            block.blockType
                                        )
                                            ? REVIEW_SECTION_LABELS[
                                                  block.blockType as BlockType
                                              ]
                                            : null) || block.blockType;
                                    return (
                                        <li
                                            key={block._id}
                                            className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2"
                                        >
                                            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                                                {label}
                                                {block.isVisible === false ? (
                                                    <span className="ml-2 text-xs text-amber-600">
                                                        (hidden)
                                                    </span>
                                                ) : null}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={busy || index === 0}
                                                onClick={() =>
                                                    onMove(block._id, "up")
                                                }
                                                className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                                                title="Move up"
                                            >
                                                <ArrowUp className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={
                                                    busy ||
                                                    index === sorted.length - 1
                                                }
                                                onClick={() =>
                                                    onMove(block._id, "down")
                                                }
                                                className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                                                title="Move down"
                                            >
                                                <ArrowDown className="h-4 w-4" />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={() => setExpertOpen((v) => !v)}
                                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                            >
                                {expertOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                                Expert options
                            </button>
                            {expertOpen ? (
                                <div className="mt-3 space-y-4">
                                    {sorted.map((block) => (
                                        <div
                                            key={block._id}
                                            className="rounded-lg border border-slate-100 p-3"
                                        >
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                {REVIEW_SECTION_LABELS[
                                                    block.blockType as BlockType
                                                ] || block.blockType}
                                            </p>
                                            <BlockConfigForm
                                                blockType={block.blockType}
                                                config={block.config || {}}
                                                title={block.title || ""}
                                                isVisible={
                                                    block.isVisible !== false
                                                }
                                                onChange={(next) =>
                                                    onBlockChange(
                                                        block._id,
                                                        next
                                                    )
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}
            </section>
        </div>
    );
}
