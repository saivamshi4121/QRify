"use client";

import { useState } from "react";
import {
    ArrowDown,
    ArrowUp,
    ChevronDown,
    ChevronRight,
    Trash2,
} from "lucide-react";
import { blockRegistry } from "@/modules/smartpage/blockRegistry";
import { BlockConfigForm } from "@/components/smartpage/BlockConfigForm";
import { AddBlockMenu } from "@/components/smartpage/AddBlockMenu";
import { BlockType } from "@/modules/smartpage/constants";

export type EditorBlock = {
    _id: string;
    blockType: string;
    sortOrder: number;
    title?: string;
    config: Record<string, unknown>;
    isVisible?: boolean;
};

type BlockListEditorProps = {
    blocks: EditorBlock[];
    busy?: boolean;
    onAdd: (blockType: BlockType) => void;
    onDelete: (blockId: string) => void;
    onMove: (blockId: string, direction: "up" | "down") => void;
    onChangeBlock: (
        blockId: string,
        next: {
            config: Record<string, unknown>;
            title?: string;
            isVisible?: boolean;
        }
    ) => void;
};

/**
 * Modular list editor. Reorder is exposed via onMove so DnD can replace
 * Move Up/Down later without rewriting the page shell.
 */
export function BlockListEditor({
    blocks,
    busy,
    onAdd,
    onDelete,
    onMove,
    onChangeBlock,
}: BlockListEditorProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div className="space-y-4">
            <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Add block</p>
                <AddBlockMenu onAdd={onAdd} disabled={busy} />
            </div>

            {sorted.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                    No blocks yet. Add a header or rating to get started.
                </p>
            ) : (
                <ul className="space-y-2">
                    {sorted.map((block, index) => {
                        const def = blockRegistry.isRegistered(block.blockType)
                            ? blockRegistry.get(block.blockType)
                            : null;
                        const open = expandedId === block._id;

                        return (
                            <li
                                key={block._id}
                                className="rounded-lg border border-slate-200 bg-white"
                            >
                                <div className="flex items-center gap-2 px-3 py-2">
                                    <button
                                        type="button"
                                        className="text-slate-400 hover:text-slate-700"
                                        onClick={() =>
                                            setExpandedId(open ? null : block._id)
                                        }
                                    >
                                        {open ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </button>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-slate-800">
                                            {def?.displayName || block.blockType}
                                            {block.title ? (
                                                <span className="ml-2 font-normal text-slate-400">
                                                    — {block.title}
                                                </span>
                                            ) : null}
                                        </p>
                                        {block.isVisible === false ? (
                                            <p className="text-xs text-amber-600">Hidden</p>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            title="Move up"
                                            disabled={busy || index === 0}
                                            onClick={() => onMove(block._id, "up")}
                                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            title="Move down"
                                            disabled={busy || index === sorted.length - 1}
                                            onClick={() => onMove(block._id, "down")}
                                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            title="Delete"
                                            disabled={busy}
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        "Delete this block? This cannot be undone."
                                                    )
                                                ) {
                                                    onDelete(block._id);
                                                }
                                            }}
                                            className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                {open ? (
                                    <div className="border-t border-slate-100 px-3 py-3">
                                        <BlockConfigForm
                                            blockType={block.blockType}
                                            config={block.config || {}}
                                            title={block.title || ""}
                                            isVisible={block.isVisible !== false}
                                            onChange={(next) =>
                                                onChangeBlock(block._id, next)
                                            }
                                        />
                                    </div>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
