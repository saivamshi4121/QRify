import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardChrome } from "./_components/DashboardChrome";

/**
 * Server layout: session is resolved on the server and passed as props.
 * Avoids a full Client Component layout that SSR's + hydrates (Turbopack
 * HMR was repeatedly mismatching that tree).
 */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    return (
        <DashboardChrome
            user={{
                name: session?.user?.name || "User",
                subscriptionPlan: session?.user?.subscriptionPlan || "Free",
            }}
        >
            {children}
        </DashboardChrome>
    );
}
