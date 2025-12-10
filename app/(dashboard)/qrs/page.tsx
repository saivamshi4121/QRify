"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
    MoreVertical,
    MousePointer2,
    Calendar,
    Plus,
    Loader2,
    ExternalLink,
    Edit,
    Save,
    X,
    Eye,
    Trash2,
    Code
} from "lucide-react";
import { SectionCard } from "@/app/(dashboard)/_components/SectionCard";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";

interface QRCodeType {
    _id: string;
    qrName: string;
    qrType: string;
    qrImageUrl: string;
    scanCount: number;
    isActive: boolean;
    createdAt: string;
    shortUrl: string;
    originalData: string;
}

// Simple internal modal component
function EditLinkModal({ isOpen, onClose, qr, onUpdate }: any) {
    const [url, setUrl] = useState(qr?.originalData || "");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (qr) setUrl(qr.originalData);
    }, [qr]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/qr/update-link/${qr._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newOriginalData: url })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message);

            toast.success("Destination URL updated!");
            onUpdate(); // refresh list
            onClose();
        } catch (e: any) {
            toast.error(e.message || "Failed to update");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900">Edit Destination Link</h3>
                    <button onClick={onClose}><X className="h-5 w-5 text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">New Destination URL</label>
                        <input
                            type="text"
                            required
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md">Cancel</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Update Link
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// View QR Modal with Integration Options
function ViewQRModal({ isOpen, onClose, qr }: any) {
    const [activeTab, setActiveTab] = useState<"preview" | "embed">("preview");
    const [copied, setCopied] = useState<string | null>(null);

    if (!isOpen || !qr) return null;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const embedUrl = `${baseUrl}/embed/${qr.shortUrl}`;
    const iframeCode = `<iframe src="${embedUrl}" width="400" height="400" frameborder="0" style="border: none;"></iframe>`;
    const scriptCode = `<div id="smartqr-embed-${qr.shortUrl}"></div>\n<script src="${baseUrl}/embed.js" data-shorturl="${qr.shortUrl}"></script>`;

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-slate-900">{qr.qrName}</h3>
                    <button onClick={onClose}><X className="h-5 w-5 text-slate-400 hover:text-slate-600" /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab("preview")}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === "preview"
                                ? "text-indigo-600 border-b-2 border-indigo-600"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Preview
                    </button>
                    <button
                        onClick={() => setActiveTab("embed")}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === "embed"
                                ? "text-indigo-600 border-b-2 border-indigo-600"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Website Integration
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === "preview" ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-2 border border-slate-200 rounded-lg bg-white shadow-sm">
                                <Image 
                                    src={qr.qrImageUrl} 
                                    alt={qr.qrName || "QR Code"} 
                                    width={192}
                                    height={192}
                                    className="w-48 h-48 object-contain"
                                    loading="lazy"
                                    unoptimized={!qr.qrImageUrl.includes("cloudinary.com")}
                                />
                            </div>
                            <a href={qr.qrImageUrl} download="qr-code.png" className="text-sm font-medium text-indigo-600 hover:underline">
                                Download High Res
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* iframe Embed */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-2">1. iframe Embed</h4>
                                <p className="text-xs text-slate-500 mb-3">Copy and paste this code into your HTML:</p>
                                <div className="relative">
                                    <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs overflow-x-auto">
                                        <code>{iframeCode}</code>
                                    </pre>
                                    <button
                                        onClick={() => copyToClipboard(iframeCode, "iframe")}
                                        className="absolute top-2 right-2 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                    >
                                        {copied === "iframe" ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                            </div>

                            {/* Script Embed */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-2">2. Script Embed</h4>
                                <p className="text-xs text-slate-500 mb-3">Add this to your HTML page:</p>
                                <div className="relative">
                                    <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs overflow-x-auto">
                                        <code>{scriptCode}</code>
                                    </pre>
                                    <button
                                        onClick={() => copyToClipboard(scriptCode, "script")}
                                        className="absolute top-2 right-2 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                    >
                                        {copied === "script" ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                            </div>

                            {/* Direct Image URL */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-2">3. Direct Image URL</h4>
                                <p className="text-xs text-slate-500 mb-3">Use this URL directly in an img tag:</p>
                                <div className="relative">
                                    <input
                                        type="text"
                                        readOnly
                                        value={qr.qrImageUrl}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs pr-20"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(qr.qrImageUrl, "image")}
                                        className="absolute top-2 right-2 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                    >
                                        {copied === "image" ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                            </div>

                            {/* React/Next.js Component */}
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900 mb-2">4. React / Next.js Component</h4>
                                <p className="text-xs text-slate-500 mb-3">Install and use our React component:</p>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs overflow-x-auto">
                                            <code>{`npm install @smartqr/react`}</code>
                                        </pre>
                                        <button
                                            onClick={() => copyToClipboard("npm install @smartqr/react", "npm")}
                                            className="absolute top-2 right-2 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                        >
                                            {copied === "npm" ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs overflow-x-auto">
                                            <code>{`import { SmartQR } from '@smartqr/react';\n\n<SmartQR shortUrl="${qr.shortUrl}" />`}</code>
                                        </pre>
                                        <button
                                            onClick={() => copyToClipboard(`import { SmartQR } from '@smartqr/react';\n\n<SmartQR shortUrl="${qr.shortUrl}" />`, "react")}
                                            className="absolute top-2 right-2 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                        >
                                            {copied === "react" ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MyQRsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [qrs, setQrs] = useState<QRCodeType[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedQR, setSelectedQR] = useState<QRCodeType | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchQRs = async () => {
        try {
            const res = await fetch("/api/qrs");
            if (!res.ok) throw new Error("Failed to fetch QRs");
            const json = await res.json();
            setQrs(json.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) fetchQRs();
    }, [session]);

    const openEditModal = (qr: QRCodeType) => {
        setSelectedQR(qr);
        setIsEditOpen(true);
    };

    const openViewModal = (qr: QRCodeType) => {
        setSelectedQR(qr);
        setIsViewOpen(true);
    };

    const openDeleteModal = (qr: QRCodeType) => {
        setSelectedQR(qr);
        setIsDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedQR) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/qr/delete/${selectedQR._id}`, {
                method: "DELETE",
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to delete QR");

            toast.success("QR Code deleted successfully!");
            setIsDeleteOpen(false);
            setSelectedQR(null);
            fetchQRs(); // Refresh the list
        } catch (e: any) {
            toast.error(e.message || "Failed to delete QR");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;

    return (
        <div className="space-y-8">
            <Toaster richColors position="top-right" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My QR Codes</h1>
                    <p className="mt-2 text-slate-500">Manage and track your dynamic QR codes.</p>
                </div>
                <Link
                    href="/create"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
                >
                    <Plus className="h-4 w-4" />
                    Create New QR
                </Link>
            </div>

            <SectionCard title="Your QRs" className="overflow-hidden">
                {qrs.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-slate-500">You haven't created any QR codes yet.</p>
                        <Link href="/create" className="text-indigo-600 font-medium hover:underline mt-2 inline-block">Create your first one</Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-500">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Name</th>
                                    <th className="px-6 py-3 font-semibold">Destination</th>
                                    <th className="px-6 py-3 font-semibold">Scans</th>
                                    <th className="px-6 py-3 font-semibold">Created</th>
                                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {qrs.map((qr) => (
                                    <tr key={qr._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-12 w-12 shrink-0 rounded border border-slate-200 bg-white p-1 cursor-pointer hover:border-indigo-300"
                                                    onClick={() => openViewModal(qr)}
                                                >
                                                    <Image
                                                        src={qr.qrImageUrl}
                                                        alt={qr.qrName || "QR Code"}
                                                        width={48}
                                                        height={48}
                                                        className="h-full w-full object-contain"
                                                        loading="lazy"
                                                        unoptimized={!qr.qrImageUrl.includes("cloudinary.com")}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{qr.qrName}</div>
                                                    <div className="text-xs text-slate-400">/{qr.shortUrl}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 max-w-[200px]">
                                            <div className="truncate text-slate-600 flex items-center gap-2">
                                                <span className="truncate max-w-[150px] block" title={qr.originalData}>{qr.originalData}</span>
                                                <button
                                                    onClick={() => openEditModal(qr)}
                                                    className="p-1 hover:bg-slate-200 rounded text-indigo-600 shrink-0"
                                                    title="Edit Destination Link"
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                                <MousePointer2 className="h-3.5 w-3.5 text-slate-400" />
                                                {qr.scanCount.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                                            {new Date(qr.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => router.push(`/qrs/${qr._id}`)}
                                                    className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                                                >
                                                    Analytics
                                                </button>
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")}/api/qr/redirect/${qr.shortUrl}`}
                                                    target="_blank"
                                                    className="text-slate-400 hover:text-slate-600"
                                                    title="Test Redirect"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                                <button
                                                    onClick={() => openDeleteModal(qr)}
                                                    className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete QR Code"
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
                )}
            </SectionCard>

            <EditLinkModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                qr={selectedQR}
                onUpdate={fetchQRs}
            />

            <ViewQRModal
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                qr={selectedQR}
            />

            {/* Delete Confirmation Modal */}
            {isDeleteOpen && selectedQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-semibold text-slate-900">Delete QR Code</h3>
                            <button 
                                onClick={() => setIsDeleteOpen(false)}
                                disabled={deleting}
                            >
                                <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-slate-700">
                                Are you sure you want to delete <span className="font-semibold">"{selectedQR.qrName}"</span>? 
                                This action cannot be undone and will also delete all associated scan analytics.
                            </p>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteOpen(false)}
                                    disabled={deleting}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
