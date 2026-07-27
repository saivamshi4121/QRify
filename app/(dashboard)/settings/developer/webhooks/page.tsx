"use client";

import { ClientOnly } from "@/app/(dashboard)/_components/ClientOnly";
import WebhooksSettingsClient from "./WebhooksSettingsClient";

export default function WebhooksSettingsPage() {
    return (
        <ClientOnly
            fallback={
                <div className="mx-auto max-w-4xl py-10 text-sm text-slate-500">
                    Loading webhooks…
                </div>
            }
        >
            <WebhooksSettingsClient />
        </ClientOnly>
    );
}
