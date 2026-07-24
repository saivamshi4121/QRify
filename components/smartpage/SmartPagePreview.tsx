"use client";

import { BlockRenderer } from "@/components/blocks/BlockRenderer";

export type PreviewBlock = {
    _id: string;
    blockType: string;
    title?: string;
    config: Record<string, unknown>;
    isVisible?: boolean;
};

type SmartPagePreviewProps = {
    blocks: PreviewBlock[];
    theme?: {
        primaryColor?: string;
        backgroundColor?: string;
        fontFamily?: string;
    };
};

export function SmartPagePreview({ blocks, theme }: SmartPagePreviewProps) {
    const visible = blocks.filter((b) => b.isVisible !== false);

    return (
        <div className="flex justify-center">
            <div
                className="overflow-hidden rounded-[1.5rem] border-[8px] border-slate-800 bg-white shadow-xl"
                style={{ width: 390, minHeight: 640 }}
            >
                <div className="flex h-6 items-center justify-center bg-slate-800">
                    <div className="h-1.5 w-16 rounded-full bg-slate-600" />
                </div>
                <div
                    className="max-h-[70vh] overflow-y-auto px-4 py-6"
                    style={{
                        backgroundColor: theme?.backgroundColor || "#ffffff",
                        color: theme?.primaryColor || "#0f172a",
                        fontFamily: theme?.fontFamily || "system-ui, sans-serif",
                    }}
                >
                    {visible.length === 0 ? (
                        <p className="py-16 text-center text-sm text-slate-400">
                            Add blocks to preview this page
                        </p>
                    ) : (
                        <div className="space-y-1 divide-y divide-slate-100">
                            {visible.map((block) => (
                                <BlockRenderer
                                    key={block._id}
                                    blockType={block.blockType}
                                    config={block.config || {}}
                                    title={block.title}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
