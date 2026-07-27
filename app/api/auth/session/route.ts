import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Explicit session endpoint so Turbopack HMR cannot briefly 404 the
 * [...nextauth] catch-all and return an HTML page to SessionProvider.
 *
 * Must return `{}` (not `null`) when unauthenticated — next-auth/react
 * runs Object.keys() on the JSON body and throws CLIENT_FETCH_ERROR otherwise.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        return NextResponse.json(session ?? {});
    } catch {
        return NextResponse.json({});
    }
}
