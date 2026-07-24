import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "@/config/dbConnect";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
        CredentialsProvider({
            name: "Qrezo Login",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "email@example.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing email or password");
                }

                await dbConnect();
                const user = await User.findOne({ email: credentials.email }).select("+password");

                if (!user) {
                    throw new Error("Invalid credentials");
                }

                const isMatch = await bcrypt.compare(credentials.password, user.password);

                if (!isMatch) {
                    throw new Error("Invalid credentials");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    subscriptionPlan: user.subscriptionPlan,
                    provider: user.provider || "email",
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                await dbConnect();
                const existingUser = await User.findOne({ email: user.email });

                if (!existingUser) {
                    const created = await User.create({
                        email: user.email,
                        name: user.name,
                        provider: "google",
                        role: "user",
                        subscriptionPlan: "free",
                        isActive: true,
                    });
                    const { ensureDefaultWorkspace } = await import(
                        "@/modules/workspace/service"
                    );
                    await ensureDefaultWorkspace(created._id.toString());
                } else {
                    const { ensureDefaultWorkspace } = await import(
                        "@/modules/workspace/service"
                    );
                    await ensureDefaultWorkspace(existingUser._id.toString());
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session, account }) {
            // If user logs in initially (check if 'user' object is present)
            if (user) {
                // For Google Provider, 'user.id' is Google Subject ID, NOT MongoDB _id.
                // We MUST fetch/ensure the MongoDB user to get the correct _id.
                if (account?.provider === "google") {
                    await dbConnect();
                    const dbUser = await User.findOne({ email: user.email });
                    // 'signIn' callback runs before 'jwt', so user should exist.
                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        token.role = dbUser.role;
                        token.subscriptionPlan = dbUser.subscriptionPlan;
                        token.provider = dbUser.provider || "google";
                    }
                } else {
                    // For Credentials, authorize() already mapped it correctly
                    token.id = user.id;
                    token.role = user.role || "user";
                    token.subscriptionPlan = user.subscriptionPlan || "free";
                    token.provider = (user as any).provider || "email";
                }
            }

            // If user updates session (e.g. upgrades plan)
            if (trigger === "update" && session) {
                token.role = session.user.role;
                token.subscriptionPlan = session.user.subscriptionPlan;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.subscriptionPlan = token.subscriptionPlan as string;
                session.user.provider = token.provider as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
    cookies: {
        sessionToken: {
            name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                domain: process.env.NODE_ENV === "production" ? undefined : undefined, // Let browser set domain
            },
        },
        callbackUrl: {
            name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.callback-url`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
        csrfToken: {
            name: `${process.env.NODE_ENV === "production" ? "__Host-" : ""}next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
