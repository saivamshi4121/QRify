import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // Allow access to admin login page without authentication
        if (req.nextUrl.pathname === "/admin/login") {
            return NextResponse.next();
        }
        
        // Protect all other admin routes
        if (req.nextUrl.pathname.startsWith("/admin") && req.nextauth.token?.role !== "admin") {
            return NextResponse.rewrite(new URL("/dashboard", req.url));
        }
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Allow admin login page without token
                if (req.nextUrl.pathname === "/admin/login") {
                    return true;
                }
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/qrs/:path*",
        "/settings/:path*",
        "/admin/:path*",
    ],
};
