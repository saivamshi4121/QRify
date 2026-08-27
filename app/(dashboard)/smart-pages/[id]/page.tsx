"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ArrowLeft,
    ExternalLink,
    Loader2,
    Cloud,
    CloudOff,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { SectionCard } from "@/app/(dashboard)/_components/SectionCard";
import type { EditorBlock } from "@/components/smartpage/BlockListEditor";
import { ReviewPageForm } from "@/components/smartpage/ReviewPageForm";
import { SmartPagePreview } from "@/components/smartpage/SmartPagePreview";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { seedReviewPageBlocks } from "@/lib/smartpage/seedReviewPageBlocks";
import { blockRegistry } from "@/modules/smartpage/blockRegistry";
import { BlockType } from "@/modules/smartpage/constants";

type PageMeta = {
    _id: string;
    title: string;
    slug: string;
    isPublished: boolean;
    theme?: {
        primaryColor?: string;
        backgroundColor?: string;
        fontFamily?: string;
    };
};

function mapBlock(b: {
    _id: string;
    blockType: string;
    sortOrder: number;
    title?: string;
    config?: Record<string, unknown>;
    isVisible?: boolean;
}): EditorBlock {
    return {
        _id: String(b._id),
        blockType: b.blockType,
        sortOrder: b.sortOrder,
        title: b.title,
        config: (b.config || {}) as Record<string, unknown>,
        isVisible: b.isVisible,
    };
}

export default function ReviewPageEditorPage() {
    const params = useParams();
    const pageId = String(params.id);
    const { data: session, status } = useSession();
    const router = useRouter();

    const [page, setPage] = useState<PageMeta | null>(null);
    const [blocks, setBlocks] = useState<EditorBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const dirtyRef = useRef(false);
    const pendingMetaRef = useRef(false);
    const pendingBlockRef = useRef(false);
    const seedingRef = useRef(false);

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    const markDirty = useCallback((value: boolean) => {
        dirtyRef.current = value;
        setDirty(value);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [pageRes, blocksRes] = await Promise.all([
                fetch(`/api/v2/smartpages/${pageId}`),
                fetch(`/api/v2/smartpages/${pageId}/blocks`),
            ]);
            const pageJson = await pageRes.json();
            const blocksJson = await blocksRes.json();
            if (!pageRes.ok) throw new Error(pageJson.message || "Page not found");
            if (!blocksRes.ok)
                throw new Error(blocksJson.message || "Failed to load");

            setPage(pageJson.data);
            let nextBlocks = (blocksJson.data || []).map(mapBlock);

            if (nextBlocks.length === 0 && !seedingRef.current) {
                seedingRef.current = true;
                try {
                    nextBlocks = (await seedReviewPageBlocks(pageId)).map(
                        mapBlock
                    );
                } catch (e) {
                    toast.error(
                        e instanceof Error
                            ? e.message
                            : "Could not set up page sections"
                    );
                } finally {
                    seedingRef.current = false;
                }
            }

            setBlocks(nextBlocks);
            markDirty(false);
            setSaveError(null);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load");
            router.push("/smart-pages");
        } finally {
            setLoading(false);
        }
    }, [pageId, router, markDirty]);

    useEffect(() => {
        if (session) load();
    }, [session, load]);

    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (
                dirtyRef.current ||
                pendingMetaRef.current ||
                pendingBlockRef.current
            ) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, []);

    const saveMeta = useCallback(
        async (meta: { title: string; slug: string; isPublished: boolean }) => {
            pendingMetaRef.current = false;
            try {
                const res = await fetch(`/api/v2/smartpages/${pageId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(meta),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "Save failed");
                setPage((prev) =>
                    prev
                        ? {
                              ...prev,
                              title: json.data.title,
                              slug: json.data.slug,
                              isPublished: json.data.isPublished,
                          }
                        : prev
                );
                setSaveError(null);
                if (!pendingBlockRef.current) markDirty(false);
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Save failed";
                setSaveError(msg);
                toast.error(msg);
            }
        },
        [pageId, markDirty]
    );

    const metaDebounce = useDebouncedCallback(
        async (meta: { title: string; slug: string; isPublished: boolean }) => {
            await saveMeta(meta);
        },
        600
    );

    const saveBlock = useCallback(
        async (
            blockId: string,
            next: {
                config: Record<string, unknown>;
                title?: string;
                isVisible?: boolean;
            }
        ) => {
            pendingBlockRef.current = false;
            try {
                const res = await fetch(`/api/v2/blocks/${blockId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        config: next.config,
                        title: next.title,
                        isVisible: next.isVisible,
                    }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "Save failed");
                setSaveError(null);
                if (!pendingMetaRef.current && !metaDebounce.hasPending()) {
                    markDirty(false);
                }
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Save failed";
                setSaveError(msg);
                toast.error(msg);
            }
        },
        [markDirty, metaDebounce]
    );

    const blockDebounce = useDebouncedCallback(
        async (
            blockId: string,
            next: {
                config: Record<string, unknown>;
                title?: string;
                isVisible?: boolean;
            }
        ) => {
            await saveBlock(blockId, next);
        },
        600
    );

    function updateLocalMeta(partial: Partial<PageMeta>) {
        setPage((prev) => {
            if (!prev) return prev;
            const next = { ...prev, ...partial };
            pendingMetaRef.current = true;
            markDirty(true);
            metaDebounce.schedule({
                title: next.title,
                slug: next.slug,
                isPublished: next.isPublished,
            });
            return next;
        });
    }

    function handleBlockChange(
        blockId: string,
        next: {
            config: Record<string, unknown>;
            title?: string;
            isVisible?: boolean;
        }
    ) {
        setBlocks((prev) =>
            prev.map((b) =>
                b._id === blockId
                    ? {
                          ...b,
                          config: next.config,
                          title: next.title,
                          isVisible: next.isVisible,
                      }
                    : b
            )
        );
        pendingBlockRef.current = true;
        markDirty(true);
        blockDebounce.schedule(blockId, next);
    }

    async function handleEnsureBlock(
        blockType: BlockType
    ): Promise<EditorBlock | null> {
        const existing = blocks.find((b) => b.blockType === blockType);
        if (existing) return existing;

        setBusy(true);
        try {
            const def = blockRegistry.get(blockType);
            const res = await fetch(`/api/v2/smartpages/${pageId}/blocks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    blockType,
                    config: def.defaultConfig,
                    isVisible: true,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Could not add section");
            const mapped = mapBlock(json.data);
            setBlocks((prev) => [...prev, mapped]);
            return mapped;
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not add section");
            return null;
        } finally {
            setBusy(false);
        }
    }

    async function handleMove(blockId: string, direction: "up" | "down") {
        const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);
        const index = sorted.findIndex((b) => b._id === blockId);
        if (index < 0) return;
        const swapWith = direction === "up" ? index - 1 : index + 1;
        if (swapWith < 0 || swapWith >= sorted.length) return;

        const a = sorted[index];
        const b = sorted[swapWith];
        const orderA = a.sortOrder;
        const orderB = b.sortOrder;

        setBusy(true);
        try {
            const [resA, resB] = await Promise.all([
                fetch(`/api/v2/blocks/${a._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sortOrder: orderB }),
                }),
                fetch(`/api/v2/blocks/${b._id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sortOrder: orderA }),
                }),
            ]);
            if (!resA.ok || !resB.ok) throw new Error("Reorder failed");
            setBlocks((prev) =>
                prev.map((block) => {
                    if (block._id === a._id) return { ...block, sortOrder: orderB };
                    if (block._id === b._id) return { ...block, sortOrder: orderA };
                    return block;
                })
            );
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Reorder failed");
            load();
        } finally {
            setBusy(false);
        }
    }

    function confirmLeave() {
        if (dirty || metaDebounce.hasPending() || blockDebounce.hasPending()) {
            return confirm(
                "You have unsaved or pending changes. Leave anyway?"
            );
        }
        return true;
    }

    function handleBack() {
        if (!confirmLeave()) return;
        router.push("/smart-pages");
    }

    const previewBlocks = useMemo(
        () =>
            [...blocks]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((b) => ({
                    _id: b._id,
                    blockType: b.blockType,
                    title: b.title,
                    config: b.config,
                    isVisible: b.isVisible,
                })),
        [blocks]
    );

    const saving = metaDebounce.isPending || blockDebounce.isPending;

    if (loading || !page) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Toaster richColors position="top-right" />

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="rounded-md p-2 text-slate-500 hover:bg-white/[0.06]"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Your review page
                        </h1>
                        <p className="text-sm text-slate-500">
                            Changes save automatically.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    {saving ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving…
                        </span>
                    ) : saveError ? (
                        <span className="inline-flex items-center gap-1.5 text-red-500">
                            <CloudOff className="h-4 w-4" />
                            Save failed
                        </span>
                    ) : dirty ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-600">
                            <Cloud className="h-4 w-4" />
                            Pending…
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600">
                            <Cloud className="h-4 w-4" />
                            Saved
                        </span>
                    )}

                    <div className="hidden items-center gap-2 xl:flex">
                        <span className="text-slate-500">Status</span>
                        <select
                            className="rounded-md border border-white/[0.08] bg-white/[0.06] px-2 py-1.5 text-sm text-white outline-none"
                            value={page.isPublished ? "live" : "draft"}
                            onChange={(e) =>
                                updateLocalMeta({
                                    isPublished: e.target.value === "live",
                                })
                            }
                        >
                            <option value="draft">Draft</option>
                            <option value="live">Live</option>
                        </select>
                    </div>

                    {page.isPublished ? (
                        <a
                            href={`/p/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] px-3 py-1.5 text-slate-300 hover:bg-white/[0.03]"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Open live
                        </a>
                    ) : null}
                    <Link
                        href="/smart-pages"
                        onClick={(e) => {
                            if (!confirmLeave()) e.preventDefault();
                        }}
                        className="rounded-md border border-white/[0.08] px-3 py-1.5 text-slate-300 hover:bg-white/[0.03]"
                    >
                        Done
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <ReviewPageForm
                    pageTitle={page.title}
                    pageSlug={page.slug}
                    isPublished={page.isPublished}
                    blocks={blocks}
                    busy={busy}
                    onMetaChange={(partial) => updateLocalMeta(partial)}
                    onBlockChange={handleBlockChange}
                    onMove={handleMove}
                    onEnsureBlock={handleEnsureBlock}
                />

                <div className="xl:sticky xl:top-24 xl:self-start">
                    <SectionCard
                        title="Guest preview"
                        description="How your page looks on a phone"
                    >
                        <SmartPagePreview
                            blocks={previewBlocks}
                            theme={page.theme}
                        />
                    </SectionCard>
                </div>
            </div>
        </div>
    );
}
