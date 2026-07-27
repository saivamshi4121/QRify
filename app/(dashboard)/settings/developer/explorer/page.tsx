"use client";

import { ClientOnly } from "@/app/(dashboard)/_components/ClientOnly";
import ApiExplorerClient from "./ApiExplorerClient";

export default function ApiExplorerPage() {
    return (
        <ClientOnly
            fallback={
                <div className="mx-auto max-w-4xl py-10 text-sm text-slate-500">
                    Loading API explorer…
                </div>
            }
        >
            <ApiExplorerClient />
        </ClientOnly>
    );
}
