import { blockRegistry } from "@/modules/smartpage/blockRegistry";
import { DEFAULT_REVIEW_BLOCK_TYPES } from "@/components/smartpage/reviewPageLabels";

export type SeededBlock = {
    _id: string;
    blockType: string;
    sortOrder: number;
    title?: string;
    config: Record<string, unknown>;
    isVisible?: boolean;
};

/** Creates the standard restaurant review stack via existing block APIs. */
export async function seedReviewPageBlocks(
    pageId: string
): Promise<SeededBlock[]> {
    const created: SeededBlock[] = [];

    for (let i = 0; i < DEFAULT_REVIEW_BLOCK_TYPES.length; i++) {
        const blockType = DEFAULT_REVIEW_BLOCK_TYPES[i];
        const def = blockRegistry.get(blockType);
        const res = await fetch(`/api/v2/smartpages/${pageId}/blocks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                blockType,
                sortOrder: i,
                config: def.defaultConfig,
                isVisible: true,
            }),
        });
        const json = await res.json();
        if (!res.ok) {
            throw new Error(json.message || `Failed to add ${blockType}`);
        }
        const b = json.data;
        created.push({
            _id: String(b._id),
            blockType: b.blockType,
            sortOrder: b.sortOrder,
            title: b.title,
            config: (b.config || {}) as Record<string, unknown>,
            isVisible: b.isVisible,
        });
    }

    return created;
}
