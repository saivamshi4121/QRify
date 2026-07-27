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
            className="mt-4 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
        >
            <LogOut className="h-4 w-4" />
            Sign Out
        </button>
    );
}
