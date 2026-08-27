"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Copy,
    ExternalLink,
    FileText,
    Loader2,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { SectionCard } from "@/app/(dashboard)/_components/SectionCard";
import { seedReviewPageBlocks } from "@/lib/smartpage/seedReviewPageBlocks";

type SmartPageRow = {
    _id: string;
    title: string;
    slug: string;
    isPublished: boolean;
    updatedAt: string;
    createdAt: string;
};

export default function ReviewPagesListPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [pages, setPages] = useState<SmartPageRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") router.replace("/login");
    }, [status, router]);

    const fetchPages = useCallback(async () => {
        try {
            const res = await fetch("/api/v2/smartpages");
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to load");
            setPages(json.data || []);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load pages");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (session) {
            setLoading(true);
            fetchPages();
        }
    }, [session, fetchPages]);

    async function handleCreate() {
        setCreating(true);
        try {
            const res = await fetch("/api/v2/smartpages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "My Restaurant" }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Create failed");

            try {
                await seedReviewPageBlocks(json.data._id);
            } catch {
                // Editor will seed on load if needed
            }

            toast.success("Review page created");
            router.push(`/smart-pages/${json.data._id}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Create failed");
            setCreating(false);
        }
    }

    async function toggleLive(page: SmartPageRow) {
        try {
            const res = await fetch(`/api/v2/smartpages/${page._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublished: !page.isPublished }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Update failed");
            toast.success(page.isPublished ? "Set to Draft" : "Now Live");
            fetchPages();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Update failed");
        }
    }

    async function handleDuplicate(page: SmartPageRow) {
        try {
            const res = await fetch(`/api/v2/smartpages/${page._id}/duplicate`, {
                method: "POST",
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Copy failed");
            toast.success("Page copied");
            router.push(`/smart-pages/${json.data._id}`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Copy failed");
        }
    }

    async function handleDelete(page: SmartPageRow) {
        if (!confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/v2/smartpages/${page._id}`, {
                method: "DELETE",
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Delete failed");
            toast.success("Deleted");
            fetchPages();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Delete failed");
        }
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    if (pages.length === 0) {
        return (
            <div className="space-y-6">
                <Toaster richColors position="top-right" />
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] px-6 py-16 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10">
                        <FileText className="h-7 w-7 text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                        Let&apos;s create your restaurant review page.
                    </h1>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
                        Set up your name, Google link, and private feedback in a
                        few minutes — guests scan a QR and leave a rating.
                    </p>
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={creating}
                        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                    >
                        {creating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        Create my review page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Toaster richColors position="top-right" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Review Pages
                    </h1>
                    <p className="mt-2 text-slate-400">
                        Pages guests see when they scan your QR codes.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                    {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Plus className="h-4 w-4" />
                    )}
                    New review page
                </button>
            </div>

            <SectionCard
                title="Your pages"
                description={`${pages.length} page${pages.length === 1 ? "" : "s"}`}
                icon={<FileText className="h-5 w-5" />}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-white/[0.08] text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-3 py-2 font-medium">Name</th>
                                <th className="px-3 py-2 font-medium">
                                    Public Link
                                </th>
                                <th className="px-3 py-2 font-medium">Status</th>
                                <th className="px-3 py-2 font-medium">Updated</th>
                                <th className="px-3 py-2 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                            {pages.map((page) => (
                                <tr key={page._id}>
                                    <td className="px-3 py-3 font-medium text-white">
                                        {page.title}
                                    </td>
                                    <td className="px-3 py-3 text-slate-400">
                                        /p/{page.slug}
                                    </td>
                                    <td className="px-3 py-3">
                                        <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                                page.isPublished
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : "bg-white/[0.06] text-slate-400"
                                            }`}
                                        >
                                            {page.isPublished ? "Live" : "Draft"}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-xs whitespace-nowrap text-slate-500">
                                        {new Date(
                                            page.updatedAt
                                        ).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex flex-wrap items-center gap-1">
                                            <Link
                                                href={`/smart-pages/${page._id}`}
                                                className="rounded p-1.5 text-slate-400 hover:bg-white/[0.06]"
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                            <button
                                                type="button"
                                                title={
                                                    page.isPublished
                                                        ? "Set to Draft"
                                                        : "Go Live"
                                                }
                                                onClick={() => toggleLive(page)}
                                                className="rounded px-2 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-500/10"
                                            >
                                                {page.isPublished
                                                    ? "Set Draft"
                                                    : "Go Live"}
                                            </button>
                                            <button
                                                type="button"
                                                title="Copy page"
                                                onClick={() =>
                                                    handleDuplicate(page)
                                                }
                                                className="rounded p-1.5 text-slate-400 hover:bg-white/[0.06]"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                            {page.isPublished ? (
                                                <a
                                                    href={`/p/${page.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="rounded p-1.5 text-slate-400 hover:bg-white/[0.06]"
                                                    title="Open public page"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            ) : null}
                                            <button
                                                type="button"
                                                title="Delete"
                                                onClick={() =>
                                                    handleDelete(page)
                                                }
                                                className="rounded p-1.5 text-red-400 hover:bg-red-500/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SectionCard>
        </div>
    );
}
