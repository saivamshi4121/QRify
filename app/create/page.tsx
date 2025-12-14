"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, RefreshCw, Lock, X, ArrowUp } from "lucide-react";
import { toast, Toaster } from "sonner";
import { SectionCard } from "@/app/(dashboard)/_components/SectionCard";
import Link from "next/link";
import { QrCode } from "lucide-react";

function CreateQRForm() {
    const { data: session, status } = useSession(); // status: 'authenticated' | 'loading' | 'unauthenticated'
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [foregroundColor, setForegroundColor] = useState("#000000");
    const [backgroundColor, setBackgroundColor] = useState("#ffffff");
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Auto-resume logic
    useEffect(() => {
        const checkPendingDownload = async () => {
            // Logic: If user is logged in, and we have a "pending_qr_form" in localStorage,
            // and optionally ?action=download is present
            if (status === "authenticated") {
                const pendingForm = localStorage.getItem("pending_qr_form");
                const action = searchParams.get("action");

                if (pendingForm && action === "download") {
                    // Auto-generate
                    setDownloadLoading(true);
                    try {
                        const formData = JSON.parse(pendingForm);
                        const res = await fetch("/api/qr/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(formData),
                        });

                        const json = await res.json();
                        if (!res.ok) {
                            // Check if it's a free plan limit reached
                            if (json.upgradeRequired && json.currentPlan === "free") {
                                setShowUpgradeModal(true);
                                localStorage.removeItem("pending_qr_form");
                                setDownloadLoading(false);
                                return;
                            }
                            throw new Error(json.message);
                        }

                        // Clear storage
                        localStorage.removeItem("pending_qr_form");

                        toast.success("QR Code Saved Successfully!");

                        // Redirect to QR codes page
                        setTimeout(() => {
                            router.push("/qrs");
                        }, 1500);

                    } catch (e: any) {
                        // Check if it's a free plan limit reached
                        if (e.message?.includes("Free plan limit reached")) {
                            setShowUpgradeModal(true);
                        } else {
                            toast.error(e.message || "Failed to save QR");
                        }
                        setDownloadLoading(false);
                    }
                }
            }
        };

        checkPendingDownload();
    }, [status, searchParams, router]);



    // Handle Logo Upload
    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }
        
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Logo must be less than 2MB");
            return;
        }

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (event) => {
            setLogoPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server for actual QR generation
        try {
            const formData = new FormData();
            formData.append("logo", file);

            const res = await fetch("/api/qr/upload-logo", {
                method: "POST",
                body: formData,
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.message);

            setLogoUrl(json.logoUrl);
            toast.success("Logo uploaded successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to upload logo");
            setLogoPreview(null);
        }
    }

    // Handle Preview
    async function handlePreview(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            originalData: formData.get("originalData"),
            foregroundColor: foregroundColor,
            backgroundColor: backgroundColor,
            logoUrl: logoUrl || null,
        };

        try {
            const res = await fetch("/api/qr/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.message);

            setPreviewUrl(json.previewImageUrl);
            toast.success("Preview generated!");

        } catch (error: any) {
            toast.error(error.message || "Preview failed");
        } finally {
            setLoading(false);
        }
    }

    // Handle Download (Actual Generation)
    async function handleDownload() {
        // 1. Gather form data again (simple way: rely on user not changing form since preview, 
        // or better: store state. For Public Create Page, lets grab from DOM or state.
        // I will use a ref or just grab from form inputs directly if I controlled input state, 
        // but here I used uncontrolled form. 
        // Let's assume user hits "Preview" first, so we might want to store that Config in state.
        // For simplicity, I'll recommend the user hits preview, but if I want to just grab current form values:
        const form = document.querySelector("form") as HTMLFormElement;
        if (!form) return;

        const formData = new FormData(form);
        const data = {
            qrName: formData.get("qrName"),
            qrType: formData.get("qrType"),
            originalData: formData.get("originalData"),
            foregroundColor: foregroundColor,
            backgroundColor: backgroundColor,
            logoUrl: logoUrl || null,
        };

        if (!session) {
            // Not logged in -> Save to LocalStorage and Redirect
            localStorage.setItem("pending_qr_form", JSON.stringify(data));
            toast.info("Redirecting to login to save your QR...");
            setTimeout(() => {
                router.push("/login?redirect=/create&action=download");
            }, 1000);
            return;
        }

        // Logged in -> Generate
        setDownloadLoading(true);
        try {
            const res = await fetch("/api/qr/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const json = await res.json();
            if (!res.ok) {
                // Check if it's a free plan limit reached
                if (json.upgradeRequired && json.currentPlan === "free") {
                    setShowUpgradeModal(true);
                } else {
                    throw new Error(json.message);
                }
                setDownloadLoading(false);
                return;
            }

            toast.success("QR Saved to your Dashboard!");

            // Redirect
            router.push("/qrs");

        } catch (error: any) {
            toast.error(error.message || "Failed to save QR");
            setDownloadLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="border-b border-slate-200 bg-white px-6 py-4">
                <div className="mx-auto max-w-7xl flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
                        <QrCode className="h-6 w-6" />
                        <span>Qrezo</span>
                    </Link>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto space-y-8 p-8">
                <Toaster richColors position="top-right" />

                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Create QR Code</h1>
                    <p className="mt-2 text-slate-500">Design your QR. Preview it instantly. Login to save & download.</p>
                </div>

                {downloadLoading && (
                    <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <p className="font-medium text-slate-700">Saving your QR Code...</p>
                        </div>
                    </div>
                )}

                {/* Upgrade Modal */}
                {showUpgradeModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in duration-200">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <ArrowUp className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">Upgrade to Pro</h3>
                                            <p className="text-sm text-slate-500">Free plan limit reached</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowUpgradeModal(false)}
                                        className="text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                        <p className="text-sm text-slate-700 mb-2">
                                            You've reached the <span className="font-semibold">Free plan limit of 3 QR codes</span>.
                                        </p>
                                        <p className="text-sm text-slate-600">
                                            Upgrade to <span className="font-semibold text-indigo-600">Pro plan</span> to create more QR codes and unlock advanced features.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>
                                            <span>5 Dynamic QR Codes</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>
                                            <span>Advanced Analytics</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>
                                            <span>Custom Logo & Colors</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-700">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>
                                            <span>Priority Support</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setShowUpgradeModal(false)}
                                            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                                        >
                                            Maybe Later
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowUpgradeModal(false);
                                                router.push("/settings");
                                            }}
                                            className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-all"
                                        >
                                            Upgrade Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Form Section */}
                    <SectionCard title="Configuration">
                        <form onSubmit={handlePreview} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">QR Name</label>
                                <input name="qrName" required type="text" placeholder="e.g. My Website" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">Type</label>
                                <select name="qrType" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                                    <option value="url">Website URL</option>
                                    <option value="text">Plain Text</option>
                                    <option value="email">Email</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">Content</label>
                                <input name="originalData" required type="text" placeholder="https://example.com" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>

                            {/* Colors */}
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">QR Color</label>
                                    <input 
                                        type="color" 
                                        value={foregroundColor}
                                        onChange={(e) => setForegroundColor(e.target.value)}
                                        className="h-10 w-full p-1 rounded border border-slate-300 cursor-pointer" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Background</label>
                                    <input 
                                        type="color" 
                                        value={backgroundColor}
                                        onChange={(e) => setBackgroundColor(e.target.value)}
                                        className="h-10 w-full p-1 rounded border border-slate-300 cursor-pointer" 
                                    />
                                </div>
                            </div>

                            {/* Logo Upload */}
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">Logo</label>
                                <p className="text-xs text-slate-500 mb-1.5">Logo will appear in the center of the QR code</p>
                                <input 
                                    name="logo" 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:ring-indigo-500 focus:border-indigo-500 outline-none file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                {logoPreview && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <img src={logoPreview} alt="Logo preview" className="h-10 w-10 object-contain border border-slate-200 rounded" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLogoPreview(null);
                                                setLogoUrl(null);
                                            }}
                                            className="text-xs text-red-600 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><RefreshCw className="h-4 w-4" /> Preview QR</>}
                                </button>
                            </div>
                        </form>
                    </SectionCard>

                    {/* Preview Section */}
                    <div className="space-y-6">
                        <SectionCard title="Preview" className="h-full flex flex-col">
                            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
                                {previewUrl ? (
                                    <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                                        <div className="p-4 bg-white rounded-xl shadow-lg border border-slate-100 inline-block">
                                            <img src={previewUrl} alt="Generated QR" className="w-48 h-48 object-contain" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-slate-400">Preview Mode</p>
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
                                                <p className="text-xs font-medium text-amber-800 mb-1">
                                                    ⚠️ Preview QR Code
                                                </p>
                                                <p className="text-xs text-amber-700">
                                                    This QR code is for preview only and will not work when scanned. Save it to your dashboard to make it functional.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">Click Preview to generate</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleDownload}
                                disabled={!previewUrl || loading}
                                className="w-full mt-6 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {!session && <Lock className="h-4 w-4" />}
                                {session ? "Save to Dashboard" : "Login to Save & Download"}
                            </button>

                            {!session && previewUrl && (
                                <p className="text-center text-xs text-slate-400">
                                    You must be logged in to save this QR code.
                                </p>
                            )}
                        </SectionCard>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PublicCreateQRPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <QrCode className="h-8 w-8 mx-auto mb-4 text-indigo-600 animate-pulse" />
                    <p className="text-slate-500">Loading...</p>
                </div>
            </div>
        }>
            <CreateQRForm />
        </Suspense>
    );
}
