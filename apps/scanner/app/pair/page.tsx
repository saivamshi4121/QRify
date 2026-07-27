import { Suspense } from "react";
import PairClient from "./PairClient";

export default function PairPage() {
    return (
        <Suspense
            fallback={
                <main style={{ padding: "2rem", textAlign: "center" }}>
                    Loading…
                </main>
            }
        >
            <PairClient />
        </Suspense>
    );
}
