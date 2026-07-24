"use client";

import { blockRegistry } from "@/modules/smartpage/blockRegistry";
import { BlockType } from "@/modules/smartpage/constants";
import { Plus } from "lucide-react";

type AddBlockMenuProps = {
    onAdd: (blockType: BlockType) => void;
    disabled?: boolean;
};

export function AddBlockMenu({ onAdd, disabled }: AddBlockMenuProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {blockRegistry.list().map((def) => (
                <button
                    key={def.type}
                    type="button"
                    disabled={disabled}
                    onClick={() => onAdd(def.type)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    <Plus className="h-3.5 w-3.5" />
                    {def.displayName}
                </button>
            ))}
        </div>
    );
}
