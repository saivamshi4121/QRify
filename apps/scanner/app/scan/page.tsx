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
            <main
                style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#94a3b8",
                }}
            >
                Loading…
            </main>
        );
    }

    return <ScannerView session={session} online={online} />;
}
