"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function DashboardSignOutButton() {
    return (
        <button
            type="button"
            onClick={() =>
                void signOut({
                    callbackUrl: "/login",
                    redirect: true,
                })
            }
            className="mt-3 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-white/[0.04] hover:text-slate-300"
        >
            <LogOut className="h-4 w-4" />
            Sign Out
        </button>
    );
}
