import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function Page() {
    return (
        <Suspense
            fallback={
                <main style={{ padding: "2rem", textAlign: "center" }}>
                    Loading…
                </main>
            }
        >
            <LoginClient />
        </Suspense>
    );
}
