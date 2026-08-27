"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast, Toaster } from "sonner";
import { SectionCard } from "../_components/SectionCard";
import Link from "next/link";
import { 
    User, 
    Mail, 
    Lock, 
    CreditCard, 
    Download, 
    Trash2, 
    Save, 
    Loader2,
    Eye,
    EyeOff,
    Code2,
    Bell,
} from "lucide-react";

export default function SettingsPage() {
    const { data: session, update } = useSession();
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Profile form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    // Password form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Load user data
    useEffect(() => {
        if (session?.user) {
            setName(session.user.name || "");
            setEmail(session.user.email || "");
        }
    }, [session]);

    // Update Profile
    async function handleUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.message);

            // Update session
            await update({
                ...session,
                user: {
                    ...session?.user,
                    name: json.data.name,
                    email: json.data.email,
                },
            });

            toast.success("Profile updated successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    }

    // Change Password
    async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setPasswordLoading(true);

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            setPasswordLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            setPasswordLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/user/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.message);

            toast.success("Password changed successfully!");
            
            // Clear form
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error(error.message || "Failed to change password");
        } finally {
            setPasswordLoading(false);
        }
    }

    // Export Data
    async function handleExportData() {
        try {
            const res = await fetch("/api/user/export-data");
            const json = await res.json();
            
            if (!res.ok) throw new Error(json.message);

            // Create download link
            const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `smartqr-data-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Data exported successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to export data");
        }
    }

    // Delete Account
    async function handleDeleteAccount() {
        if (!confirm("Are you sure you want to delete your account? This action cannot be undone and all your QR codes will be deleted.")) {
            return;
        }

        const confirmText = prompt("Type 'DELETE' to confirm account deletion:");
        if (confirmText !== "DELETE") {
            toast.info("Account deletion cancelled");
            return;
        }

        try {
            const res = await fetch("/api/user/delete-account", {
                method: "DELETE",
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.message);

            toast.success("Account deleted. Redirecting...");
            setTimeout(() => {
                window.location.href = "/login";
            }, 2000);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete account");
        }
    }

    return (
        <div className="space-y-6 p-6">
            <Toaster richColors position="top-right" />

            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="mt-2 text-slate-400">Manage your account settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <SectionCard title="Profile Information" icon={<User className="h-5 w-5" />}>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 outline-none"
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 outline-none"
                                placeholder="your@email.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", border: "1px solid rgba(99,102,241,0.3)" }}
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save className="h-4 w-4" /> Save Changes</>}
                        </button>
                    </form>
                </SectionCard>

                {/* Password Change */}
                {session?.user && session.user.provider === "email" && (
                    <SectionCard title="Change Password" icon={<Lock className="h-5 w-5" />}>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 outline-none"
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 outline-none"
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/50 outline-none"
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)", border: "1px solid rgba(99,102,241,0.3)" }}
                            >
                                {passwordLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <><Lock className="h-4 w-4" /> Update Password</>}
                            </button>
                        </form>
                    </SectionCard>
                )}

                {/* Notifications */}
                <SectionCard title="Notifications" icon={<Bell className="h-5 w-5" />}>
                    <div className="space-y-3">
                        <p className="text-sm text-slate-300">
                            Automate Email, SMS, and WhatsApp messages from
                            attendee and access events.
                        </p>
                        <Link
                            href="/settings/notifications"
                            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-400 hover:text-indigo-400"
                        >
                            Manage notifications →
                        </Link>
                    </div>
                </SectionCard>

                {/* Developer Platform */}
                <SectionCard title="Developer" icon={<Code2 className="h-5 w-5" />}>
                    <div className="space-y-3">
                        <p className="text-sm text-slate-300">
                            Create API keys, explore the public REST API, and
                            integrate Qrezo into your own registration apps.
                        </p>
                        <Link
                            href="/settings/developer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-400 hover:text-indigo-400"
                        >
                            Manage API Keys →
                        </Link>
                    </div>
                </SectionCard>

                {/* Account Information */}
                <SectionCard title="Account Information" icon={<CreditCard className="h-5 w-5" />}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Subscription Plan</label>
                            <p className="text-sm font-semibold text-white capitalize">
                                {session?.user?.subscriptionPlan || "Free"} Plan
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Account Type</label>
                            <p className="text-sm font-semibold text-white capitalize">
                                {session?.user?.provider === "google" ? "Google Account" : "Email Account"}
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">User ID</label>
                            <p className="text-sm text-slate-300 font-mono text-xs">
                                {session?.user?.id?.substring(0, 8) || "N/A"}...
                            </p>
                        </div>

                        {session?.user?.subscriptionPlan === "free" && (
                            <div className="pt-2 border-t border-white/[0.06]">
                                <p className="text-xs text-slate-500 mb-2">Want more features?</p>
                                <a
                                    href="/"
                                    className="text-sm text-indigo-400 hover:text-indigo-400 font-medium inline-flex items-center gap-1"
                                >
                                    View Plans →
                                </a>
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* Data Management */}
                <SectionCard title="Data Management" icon={<Download className="h-5 w-5" />}>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-slate-300 mb-3">
                                Export all your QR codes and analytics data in JSON format.
                            </p>
                            <button
                                onClick={handleExportData}
                                className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.06] transition-all"
                            >
                                <Download className="h-4 w-4" /> Export My Data
                            </button>
                        </div>

                        <div className="pt-4 border-t border-white/[0.06]">
                            <p className="text-sm text-red-400 mb-3">
                                Deleting your account will permanently remove all your QR codes and data. This action cannot be undone.
                            </p>
                            <button
                                onClick={handleDeleteAccount}
                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-all"
                            >
                                <Trash2 className="h-4 w-4" /> Delete Account
                            </button>
                        </div>
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}
