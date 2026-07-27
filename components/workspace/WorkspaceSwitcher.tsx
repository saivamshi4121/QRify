"use client";

import { useEffect, useState } from "react";
import { ChevronsUpDown, Building2 } from "lucide-react";
import { ACTIVE_WORKSPACE_COOKIE } from "@/modules/workspace/constants";

type WorkspaceOption = {
    workspaceId: string;
    name: string;
    role: string;
    isDefault: boolean;
};

function readCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function writeActiveWorkspaceCookie(workspaceId: string) {
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `${ACTIVE_WORKSPACE_COOKIE}=${encodeURIComponent(workspaceId)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

interface WorkspaceSwitcherProps {
    /** "header" = compact select in topbar (default), "sidebar" = full pill in sidebar */
    variant?: "header" | "sidebar";
}

export function WorkspaceSwitcher({ variant = "header" }: WorkspaceSwitcherProps) {
    const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
    const [activeId, setActiveId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        async function load() {
            try {
                const res = await fetch("/api/v2/workspaces");
                const json = await res.json();
                if (!res.ok || !json.success) return;

                const list: WorkspaceOption[] = json.data.workspaces || [];
                setWorkspaces(list);

                const cookieId = readCookie(ACTIVE_WORKSPACE_COOKIE);
                const validCookie = list.find((w) => w.workspaceId === cookieId);
                const nextId =
                    validCookie?.workspaceId ||
                    list.find((w) => w.isDefault)?.workspaceId ||
                    list[0]?.workspaceId ||
                    "";

                if (nextId) {
                    setActiveId(nextId);
                    if (!validCookie) {
                        writeActiveWorkspaceCookie(nextId);
                    }
                }
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [mounted]);

    function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const nextId = event.target.value;
        if (!nextId || nextId === activeId) return;
        writeActiveWorkspaceCookie(nextId);
        setActiveId(nextId);
        window.location.reload();
    }

    const activeName =
        workspaces.find((w) => w.workspaceId === activeId)?.name ?? "";

    // Placeholder on server + first client paint
    if (!mounted || loading) {
        if (variant === "sidebar") {
            return (
                <div className="h-9 w-full animate-pulse rounded-lg bg-white/5" aria-hidden />
            );
        }
        return (
            <div className="h-8 w-36 animate-pulse rounded-md bg-slate-100" aria-hidden />
        );
    }

    if (workspaces.length === 0) return null;

    // Sidebar variant: custom styled button-like select
    if (variant === "sidebar") {
        return (
            <div className="relative">
                <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-500/20">
                        <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
                        {activeName}
                    </span>
                    <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                </div>
                <select
                    value={activeId}
                    onChange={handleChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label="Switch workspace"
                >
                    {workspaces.map((ws) => (
                        <option key={ws.workspaceId} value={ws.workspaceId}>
                            {ws.name}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    // Header variant (original)
    return (
        <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="hidden sm:inline text-slate-500">Workspace</span>
            <select
                value={activeId}
                onChange={handleChange}
                className="h-9 max-w-[12rem] truncate rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                aria-label="Switch workspace"
            >
                {workspaces.map((ws) => (
                    <option key={ws.workspaceId} value={ws.workspaceId}>
                        {ws.name}
                    </option>
                ))}
            </select>
        </label>
    );
}
