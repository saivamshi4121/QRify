"use client";

import { ClientOnly } from "@/app/(dashboard)/_components/ClientOnly";
import DeveloperSettingsClient from "./DeveloperSettingsClient";

export default function DeveloperSettingsPage() {
    return (
        <ClientOnly
            fallback={
                <div className="mx-auto max-w-4xl py-10 text-sm text-slate-500">
                    Loading developer settings…
                </div>
            }
        >
            <DeveloperSettingsClient />
        </ClientOnly>
    );
}
