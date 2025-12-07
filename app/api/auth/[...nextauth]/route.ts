import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "@/config/dbConnect";
import User from "@/models/User";

// Helper to normalize the callback URL to use localhost if it's a private IP
// Google OAuth requires device_id and device_name for private IPs, which is complex to implement.
// The simplest solution is to use localhost instead of private IP.
// For production, this function will return the public domain as-is.
function getNormalizedCallbackUrl(): string | undefined {
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const isProduction = process.env.NODE_ENV === "production";
    
    if (!nextAuthUrl) {
        if (isProduction) {
            // In production, NEXTAUTH_URL must be set - log error but don't throw to avoid breaking the app
            console.error("⚠️ CRITICAL: NEXTAUTH_URL is required in production. Please set it to your public domain (e.g., https://yourdomain.com)");
            // Return undefined - NextAuth will use the request URL, but Google OAuth may fail
            return undefined;
        }
        // For development, default to localhost
        console.warn("NEXTAUTH_URL is not set. Defaulting to http://localhost:3000 for Google OAuth compatibility.");
        return "http://localhost:3000";
    }
    
    // If NEXTAUTH_URL uses a private IP, convert it to localhost (development only)
    try {
        const url = new URL(nextAuthUrl);
        const hostname = url.hostname;
        
        // Check if it's a private IP
        const isPrivateIP = hostname.startsWith("192.168.") || 
                           hostname.startsWith("10.") || 
                           hostname.startsWith("172.16.") ||
                           hostname === "127.0.0.1";
        
        if (isPrivateIP && hostname !== "localhost") {
            if (isProduction) {
                // In production, private IPs should not be used
                console.error(`⚠️ CRITICAL: NEXTAUTH_URL uses private IP (${hostname}) in production. This is not supported. Please use a public domain (e.g., https://yourdomain.com)`);
                // Return as-is but log error - Google OAuth will likely fail
                return nextAuthUrl;
            }
            // In development, convert private IP to localhost
            console.warn(`NEXTAUTH_URL uses private IP (${hostname}). Converting to localhost for Google OAuth compatibility.`);
            url.hostname = "localhost";
            return url.toString();
        }
    } catch (e) {
        // If URL parsing fails, return as is (but log error in production)
        if (isProduction) {
            console.error("Failed to parse NEXTAUTH_URL:", e);
        } else {
            console.warn("Failed to parse NEXTAUTH_URL:", e);
        }
    }
    
    // For production with public domain, return as-is (this is the normal case)
    return nextAuthUrl;
}

// Helper to check if a hostname is a private IP
function isPrivateIP(hostname: string): boolean {
    return hostname.startsWith("192.168.") || 
           hostname.startsWith("10.") || 
           hostname.startsWith("172.16.") ||
           hostname === "127.0.0.1";
}

// Helper to generate device ID (consistent per device)
function generateDeviceId(hostname: string, userAgent?: string): string {
    const seed = `${hostname}-${userAgent || "default"}`;
    // Create a simple hash-like string
    return `device_${Buffer.from(seed).toString("base64").substring(0, 32).replace(/[^a-zA-Z0-9]/g, "")}`;
}

// Helper to get device name from user agent
function getDeviceName(userAgent?: string): string {
    if (!userAgent) return "Unknown Device";
    const ua = userAgent.toLowerCase();
    if (ua.includes("windows")) return "Windows Device";
    if (ua.includes("mac")) return "Mac Device";
    if (ua.includes("linux")) return "Linux Device";
    if (ua.includes("android")) return "Android Device";
    if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) return "iOS Device";
    return "Unknown Device";
}

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
            name: "QRify Login",
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
                    await User.create({
                        email: user.email,
                        name: user.name,
                        provider: "google",
                        role: "user",
                        subscriptionPlan: "free",
                        isActive: true, // Auto-activate Google users
                    });
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
                    }
                } else {
                    // For Credentials, authorize() already mapped it correctly
                    token.id = user.id;
                    token.role = user.role || "user";
                    token.subscriptionPlan = user.subscriptionPlan || "free";
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
    },
    secret: process.env.NEXTAUTH_SECRET,
    // Normalize URL to use localhost instead of private IP for Google OAuth compatibility
    url: getNormalizedCallbackUrl() || process.env.NEXTAUTH_URL,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
