"use client";

import { ClientOnly } from "@/app/(dashboard)/_components/ClientOnly";
import NotificationsSettingsClient from "./NotificationsSettingsClient";

export default function NotificationsSettingsPage() {
    return (
        <ClientOnly
            fallback={
                <div className="mx-auto max-w-4xl py-10 text-sm text-slate-500">
                    Loading notifications…
                </div>
            }
        >
            <NotificationsSettingsClient />
        </ClientOnly>
    );
}
