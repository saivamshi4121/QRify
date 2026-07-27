import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/User";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Qrezo Scanner",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing email or password");
                }
                await dbConnect();
                const user = await User.findOne({
                    email: credentials.email,
                }).select("+password");
                if (!user?.password) throw new Error("Invalid credentials");
                const ok = await bcrypt.compare(
                    credentials.password,
                    user.password
                );
                if (!ok) throw new Error("Invalid credentials");
                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role?: string }).role || "user";
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as { role?: string }).role = token.role as string;
            }
            return session;
        },
    },
    pages: { signIn: "/login", error: "/login" },
    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
    secret: process.env.NEXTAUTH_SECRET,
};
