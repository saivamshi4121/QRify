import { NextRequest, NextResponse } from "next/server";

const API_URL = (process.env.QREZO_API_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
);

type RouteParams = {
    params: Promise<{ path: string[] }> | { path: string[] };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
    return proxy(request, params, undefined);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const body = await request.text();
    return proxy(request, params, body);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const body = await request.text();
    return proxy(request, params, body);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    return proxy(request, params, undefined);
}

async function proxy(
    request: NextRequest,
    params: RouteParams["params"],
    body: string | undefined
) {
    const resolved = params instanceof Promise ? await params : params;
    const path = (resolved.path || []).join("/");
    const incomingUrl = new URL(request.url);
    const target = `${API_URL}/api/v2/${path}${incomingUrl.search}`;

    const authHeader = request.headers.get("authorization");
    const sessionCookie =
        request.cookies.get("__Secure-next-auth.session-token")?.value ||
        request.cookies.get("next-auth.session-token")?.value;

    // Public pairing endpoint needs neither auth nor cookie
    const isPublicPair = path === "scanner/pair" && request.method === "POST";

    if (!authHeader && !sessionCookie && !isPublicPair) {
        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    const headers: HeadersInit = {
        Accept: "application/json",
    };

    if (authHeader) {
        headers.Authorization = authHeader;
    }

    if (sessionCookie) {
        const cookieName =
            process.env.NODE_ENV === "production"
                ? "__Secure-next-auth.session-token"
                : "next-auth.session-token";
        const workspaceId = request.headers.get("x-workspace-id") || "";
        const cookieParts = [`${cookieName}=${sessionCookie}`];
        if (workspaceId) {
            cookieParts.push(
                `activeWorkspaceId=${encodeURIComponent(workspaceId)}`
            );
        }
        headers.Cookie = cookieParts.join("; ");
    }

    if (body !== undefined) {
        headers["Content-Type"] =
            request.headers.get("content-type") || "application/json";
    }

    try {
        const res = await fetch(target, {
            method: request.method,
            headers,
            body:
                request.method === "GET" || request.method === "HEAD"
                    ? undefined
                    : body,
            cache: "no-store",
        });

        const text = await res.text();
        return new NextResponse(text, {
            status: res.status,
            headers: {
                "Content-Type":
                    res.headers.get("Content-Type") || "application/json",
            },
        });
    } catch {
        return NextResponse.json(
            {
                success: false,
                message:
                    "Cannot reach Qrezo API. Check QREZO_API_URL and that the main app is running.",
            },
            { status: 503 }
        );
    }
}
