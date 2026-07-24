import { notFound } from "next/navigation";
import { getPublishedPageBySlug } from "@/modules/smartpage/service";
import { FeedbackFlow } from "@/components/blocks/FeedbackFlow";
import { NotFoundError } from "@/core/errors/AppError";

type PageProps = {
    params: Promise<{ slug: string }> | { slug: string };
    searchParams?:
        | Promise<Record<string, string | string[] | undefined>>
        | Record<string, string | string[] | undefined>;
};

function firstParam(
    value: string | string[] | undefined
): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
}

export default async function PublicSmartPage({
    params,
    searchParams,
}: PageProps) {
    const resolved = params instanceof Promise ? await params : params;
    const query =
        searchParams instanceof Promise
            ? await searchParams
            : searchParams || {};
    const slug = resolved.slug;

    let hydrated;
    try {
        hydrated = await getPublishedPageBySlug(slug);
    } catch (error) {
        if (error instanceof NotFoundError) notFound();
        throw error;
    }

    const { page, blocks } = hydrated;
    const theme = page.theme || {
        primaryColor: "#0f172a",
        backgroundColor: "#ffffff",
        fontFamily: "system-ui, sans-serif",
    };

    const qrCodeId = firstParam(query.qrId) || null;
    const table = firstParam(query.table);
    const zone = firstParam(query.zone);
    const locationTag = [table && `Table ${table}`, zone]
        .filter(Boolean)
        .join(" · ") || null;

    const flowBlocks = blocks.map((block) => ({
        _id: String(block._id),
        blockType: block.blockType,
        title: block.title,
        config: (block.config || {}) as Record<string, unknown>,
        sortOrder: block.sortOrder,
        isVisible: block.isVisible,
    }));

    return (
        <main
            className="mx-auto min-h-screen w-full max-w-md px-5 py-10"
            style={{
                backgroundColor: theme.backgroundColor,
                color: theme.primaryColor,
                fontFamily: theme.fontFamily,
            }}
        >
            {flowBlocks.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-400">
                    This page has no content yet.
                </p>
            ) : (
                <FeedbackFlow
                    smartPageId={String(page._id)}
                    qrCodeId={qrCodeId}
                    locationTag={locationTag}
                    blocks={flowBlocks}
                />
            )}
        </main>
    );
}
