"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadSession } from "@/lib/session";

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        const session = loadSession();
        if (!session) return;
        if (!session.gate) {
            router.replace("/gate");
            return;
        }
        router.replace("/scan");
    }, [router]);

    return (
        <main className="home">
            <div className="panel">
                <p className="brand">Qrezo Scanner</p>
                <h1>Fast event check-in</h1>
                <p className="lede">
                    Connect this device to an event and start scanning in
                    seconds.
                </p>

                <Link href="/pair" className="primary">
                    Pair Scanner
                </Link>
                <p className="hint">Connect this device to an event</p>

                <div className="divider" />

                <Link href="/login" className="secondary">
                    Staff Login
                </Link>
                <p className="hint">For organizers and permanent staff</p>
            </div>

            <style jsx>{`
                .home {
                    min-height: 100dvh;
                    display: grid;
                    place-items: center;
                    padding: 1.5rem;
                    background:
                        radial-gradient(
                            ellipse 80% 45% at 50% -10%,
                            #1e3a5f 0%,
                            transparent 55%
                        ),
                        var(--bg);
                }
                .panel {
                    width: min(100%, 22rem);
                    text-align: center;
                }
                .brand {
                    margin: 0;
                    font-size: 0.75rem;
                    letter-spacing: 0.16em;
                    text-transform: uppercase;
                    color: #93c5fd;
                    font-weight: 700;
                }
                h1 {
                    margin: 0.55rem 0 0;
                    font-size: 1.85rem;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                }
                .lede {
                    margin: 0.55rem 0 1.75rem;
                    color: var(--muted);
                    font-size: 0.98rem;
                    line-height: 1.45;
                }
                .primary,
                .secondary {
                    display: block;
                    width: 100%;
                    text-decoration: none;
                    border-radius: 0.75rem;
                    padding: 1rem;
                    font-size: 1.05rem;
                    font-weight: 650;
                }
                .primary {
                    background: #2563eb;
                    color: #fff;
                }
                .secondary {
                    background: transparent;
                    color: #e2e8f0;
                    border: 1px solid #334155;
                }
                .hint {
                    margin: 0.55rem 0 0;
                    color: var(--muted);
                    font-size: 0.85rem;
                }
                .divider {
                    height: 1px;
                    background: #1f2937;
                    margin: 1.75rem 0;
                }
            `}</style>
        </main>
    );
}
