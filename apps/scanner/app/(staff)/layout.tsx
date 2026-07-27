import Providers from "@/components/Providers";

/** NextAuth only for staff login / setup — pairing pages never hit /api/auth/session. */
export default function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <Providers>{children}</Providers>;
}
