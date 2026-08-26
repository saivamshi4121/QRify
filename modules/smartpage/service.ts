import crypto from "crypto";
import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import SmartPage from "@/models/SmartPage";
import Block from "@/models/Block";
import { blockRegistry } from "@/modules/smartpage/blockRegistry";
import { BlockType } from "@/modules/smartpage/constants";
import { NotFoundError, BadRequestError, ForbiddenError } from "@/core/errors/AppError";
import { assertWithinLimit } from "@/modules/entitlement/service";

function slugify(input: string): string {
    const base = input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
    return base || "page";
}

async function uniqueSlug(base: string): Promise<string> {
    let slug = slugify(base);
    let attempt = 0;
    while (attempt < 10) {
        const existing = await SmartPage.findOne({ slug }).select("_id").lean();
        if (!existing) return slug;
        slug = `${slugify(base)}-${crypto.randomBytes(2).toString("hex")}`;
        attempt += 1;
    }
    return `${slugify(base)}-${Date.now().toString(36)}`;
}

export async function listSmartPages(workspaceId: string) {
    await dbConnect();
    return SmartPage.find({ workspaceId }).sort({ updatedAt: -1 }).lean();
}

export async function getSmartPageForWorkspace(pageId: string, workspaceId: string) {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(pageId)) {
        throw new BadRequestError("Invalid Smart Page ID");
    }
    const page = await SmartPage.findOne({ _id: pageId, workspaceId }).lean();
    if (!page) throw new NotFoundError("Smart Page not found");
    return page;
}

export async function createSmartPage(
    workspaceId: string,
    input: {
        title: string;
        slug?: string;
        theme?: {
            primaryColor?: string;
            backgroundColor?: string;
            fontFamily?: string;
            logoUrl?: string;
        };
        isPublished?: boolean;
    }
) {
    await dbConnect();
    await assertWithinLimit(workspaceId, "smart_pages");
    const slug = input.slug
        ? await uniqueSlug(input.slug)
        : await uniqueSlug(input.title);

    return SmartPage.create({
        workspaceId,
        title: input.title,
        slug,
        theme: {
            primaryColor: input.theme?.primaryColor || "#0f172a",
            backgroundColor: input.theme?.backgroundColor || "#ffffff",
            fontFamily: input.theme?.fontFamily || "system-ui, sans-serif",
            logoUrl: input.theme?.logoUrl || undefined,
        },
        isPublished: input.isPublished ?? false,
    });
}

export async function updateSmartPage(
    pageId: string,
    workspaceId: string,
    input: {
        title?: string;
        slug?: string;
        theme?: Record<string, unknown>;
        isPublished?: boolean;
    }
) {
    await dbConnect();
    const page = await SmartPage.findOne({ _id: pageId, workspaceId });
    if (!page) throw new NotFoundError("Smart Page not found");

    if (input.title !== undefined) page.title = input.title;
    if (input.isPublished !== undefined) page.isPublished = input.isPublished;
    if (input.theme) {
        page.theme = {
            ...page.theme,
            ...input.theme,
        } as typeof page.theme;
    }
    if (input.slug) {
        const nextSlug = slugify(input.slug);
        const clash = await SmartPage.findOne({
            slug: nextSlug,
            _id: { $ne: page._id },
        })
            .select("_id")
            .lean();
        if (clash) throw new BadRequestError("Slug already in use");
        page.slug = nextSlug;
    }

    await page.save();
    return page;
}

export async function deleteSmartPage(pageId: string, workspaceId: string) {
    await dbConnect();
    const page = await SmartPage.findOne({ _id: pageId, workspaceId });
    if (!page) throw new NotFoundError("Smart Page not found");

    await Block.deleteMany({ smartPageId: page._id, workspaceId });
    await SmartPage.deleteOne({ _id: page._id });
    return { deleted: true };
}

export async function duplicateSmartPage(pageId: string, workspaceId: string) {
    await dbConnect();
    await assertWithinLimit(workspaceId, "smart_pages");
    const page = await SmartPage.findOne({ _id: pageId, workspaceId }).lean();
    if (!page) throw new NotFoundError("Smart Page not found");

    const blocks = await Block.find({ smartPageId: page._id, workspaceId })
        .sort({ sortOrder: 1 })
        .lean();

    const copyTitle = `${page.title} (Copy)`;
    const newPage = await SmartPage.create({
        workspaceId,
        title: copyTitle,
        slug: await uniqueSlug(copyTitle),
        theme: page.theme,
        isPublished: false,
    });

    if (blocks.length > 0) {
        await Block.insertMany(
            blocks.map((b) => ({
                smartPageId: newPage._id,
                workspaceId,
                blockType: b.blockType,
                sortOrder: b.sortOrder,
                title: b.title,
                config: b.config,
                isVisible: b.isVisible,
            }))
        );
    }

    return newPage;
}

export async function listBlocks(pageId: string, workspaceId: string) {
    await getSmartPageForWorkspace(pageId, workspaceId);
    return Block.find({ smartPageId: pageId, workspaceId })
        .sort({ sortOrder: 1 })
        .lean();
}

export async function createBlock(
    pageId: string,
    workspaceId: string,
    input: {
        blockType: BlockType;
        sortOrder?: number;
        title?: string;
        config?: Record<string, unknown>;
        isVisible?: boolean;
    }
) {
    await getSmartPageForWorkspace(pageId, workspaceId);

    const config = blockRegistry.validateConfig(
        input.blockType,
        input.config ?? blockRegistry.get(input.blockType).defaultConfig
    );

    let sortOrder = input.sortOrder;
    if (sortOrder === undefined) {
        const last = await Block.findOne({ smartPageId: pageId })
            .sort({ sortOrder: -1 })
            .select("sortOrder")
            .lean();
        sortOrder = (last?.sortOrder ?? -1) + 1;
    }

    return Block.create({
        smartPageId: pageId,
        workspaceId,
        blockType: input.blockType,
        sortOrder,
        title: input.title,
        config,
        isVisible: input.isVisible ?? true,
    });
}

export async function updateBlock(
    blockId: string,
    workspaceId: string,
    input: {
        blockType?: BlockType;
        sortOrder?: number;
        title?: string;
        config?: Record<string, unknown>;
        isVisible?: boolean;
    }
) {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(blockId)) {
        throw new BadRequestError("Invalid Block ID");
    }

    const block = await Block.findOne({ _id: blockId, workspaceId });
    if (!block) throw new NotFoundError("Block not found");

    const nextType = (input.blockType ?? block.blockType) as BlockType;
    if (!blockRegistry.isRegistered(nextType)) {
        throw new BadRequestError("Unsupported block type");
    }

    if (input.blockType) block.blockType = input.blockType;
    if (input.sortOrder !== undefined) block.sortOrder = input.sortOrder;
    if (input.title !== undefined) block.title = input.title;
    if (input.isVisible !== undefined) block.isVisible = input.isVisible;
    if (input.config !== undefined || input.blockType) {
        block.config = blockRegistry.validateConfig(
            nextType,
            input.config ?? block.config
        );
    }

    await block.save();
    return block;
}

export async function deleteBlock(blockId: string, workspaceId: string) {
    await dbConnect();
    const result = await Block.findOneAndDelete({ _id: blockId, workspaceId });
    if (!result) throw new NotFoundError("Block not found");
    return { deleted: true };
}

/** Public hydrate: published page + visible blocks only. */
export async function getPublishedPageBySlug(slug: string) {
    await dbConnect();
    const page = await SmartPage.findOne({
        slug: slug.toLowerCase().trim(),
        isPublished: true,
    }).lean();

    if (!page) throw new NotFoundError("Page not found");

    const blocks = await Block.find({
        smartPageId: page._id,
        isVisible: true,
    })
        .sort({ sortOrder: 1 })
        .lean();

    return { page, blocks };
}

export async function assertSmartPageInWorkspace(
    smartPageId: string,
    workspaceId: string
) {
    if (!mongoose.Types.ObjectId.isValid(smartPageId)) {
        throw new BadRequestError("Invalid Smart Page ID");
    }
    const page = await SmartPage.findOne({
        _id: smartPageId,
        workspaceId,
    })
        .select("_id")
        .lean();
    if (!page) {
        throw new ForbiddenError("Smart Page not found in this workspace");
    }
    return page;
}
