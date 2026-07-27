"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScannerView from "@/components/ScannerView";
import { loadSession, type ScannerSession } from "@/lib/session";

export default function ScanPage() {
    const router = useRouter();
    const [session, setSession] = useState<ScannerSession | null>(null);
    const [ready, setReady] = useState(false);
    const [online, setOnline] = useState(true);

    useEffect(() => {
        const s = loadSession();
        if (!s) {
            router.replace("/");
            return;
        }
        if (!s.gate) {
            router.replace("/gate");
            return;
        }
        setSession(s);
        setReady(true);
    }, [router]);

    useEffect(() => {
        const sync = () => setOnline(navigator.onLine);
        sync();
        window.addEventListener("online", sync);
        window.addEventListener("offline", sync);
        return () => {
            window.removeEventListener("online", sync);
            window.removeEventListener("offline", sync);
        };
    }, []);

    if (!ready || !session) {
        return (
            <main className="min-h-dvh bg-[#090d16] flex items-center justify-center p-6 text-zinc-400">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Initializing camera module…</span>
                </div>
            </main>
        );
    }

    return <ScannerView session={session} online={online} />;
}

