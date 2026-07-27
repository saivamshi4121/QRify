"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginClient() {
    const router = useRouter();
    const search = useSearchParams();
    const callbackUrl = search.get("callbackUrl") || "/setup";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });
        setLoading(false);
        if (res?.error) {
            setError("Invalid email or password");
            return;
        }
        router.replace(callbackUrl);
    }

    return (
        <main className="login">
            <div className="panel">
                <p className="brand">Qrezo Scanner</p>
                <h1>Sign in</h1>
                <p className="sub">For organizers and permanent staff</p>
                <form onSubmit={onSubmit}>
                    <label>
                        Email
                        <input
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>
                    <label>
                        Password
                        <input
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>
                    {error ? <p className="err">{error}</p> : null}
                    <button type="submit" disabled={loading}>
                        {loading ? "Signing in…" : "Continue"}
                    </button>
                    <Link href="/" className="back-home">
                        ← Scanner home
                    </Link>
                </form>
            </div>
            <style jsx>{`
                .login {
                    min-height: 100dvh;
                    display: grid;
                    place-items: center;
                    padding: 1.5rem;
                    background:
                        radial-gradient(
                            ellipse 80% 50% at 50% -20%,
                            #1e3a5f 0%,
                            transparent 55%
                        ),
                        var(--bg);
                }
                .panel {
                    width: min(100%, 22rem);
                }
                .brand {
                    margin: 0 0 0.35rem;
                    font-size: 0.8rem;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: #93c5fd;
                    font-weight: 700;
                }
                h1 {
                    margin: 0;
                    font-size: 1.75rem;
                    font-weight: 700;
                }
                .sub {
                    margin: 0.35rem 0 1.5rem;
                    color: var(--muted);
                    font-size: 0.95rem;
                }
                form {
                    display: flex;
                    flex-direction: column;
                    gap: 0.9rem;
                }
                label {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                    font-size: 0.85rem;
                    color: var(--muted);
                }
                input {
                    border: 1px solid #1f2937;
                    background: #0f172a;
                    color: var(--text);
                    border-radius: 0.65rem;
                    padding: 0.85rem 0.9rem;
                    font-size: 1rem;
                }
                input:focus {
                    outline: 2px solid #2563eb;
                    outline-offset: 1px;
                }
                button[type="submit"] {
                    margin-top: 0.4rem;
                    border: 0;
                    border-radius: 0.65rem;
                    padding: 0.95rem;
                    font-size: 1rem;
                    font-weight: 600;
                    background: #2563eb;
                    color: white;
                }
                button:disabled {
                    opacity: 0.65;
                }
                .back-home {
                    text-align: center;
                    color: var(--muted);
                    text-decoration: none;
                    font-size: 0.9rem;
                    margin-top: 0.25rem;
                }
                .err {
                    margin: 0;
                    color: #fca5a5;
                    font-size: 0.9rem;
                }
            `}</style>
        </main>
    );
}
