import { withAuth } from "next-auth/middleware";

/** Only staff setup requires NextAuth. Pairing uses scanner tokens. */
export default withAuth({
    pages: { signIn: "/login" },
});

export const config = {
    matcher: ["/setup/:path*"],
};
