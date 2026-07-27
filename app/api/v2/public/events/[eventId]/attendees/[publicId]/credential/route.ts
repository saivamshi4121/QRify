import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
import {
    createCredential,
    getCredential,
    regenerateCredential,
    restoreCredential,
    revokeCredential,
} from "@/modules/event-credential/service";

type RouteParams = {
    params:
        | Promise<{ eventId: string; publicId: string }>
        | { eventId: string; publicId: string };
};

async function ids(params: RouteParams["params"]) {
    const r = params instanceof Promise ? await params : params;
    return { eventId: r.eventId, publicId: r.publicId };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.CREDENTIALS_READ, async (ctx) => {
        const { eventId, publicId } = await ids(params);
        const credential = await getCredential(
            ctx.workspaceId,
            eventId,
            publicId
        );
        return publicOk(credential);
    });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    return withApiKey(request, ApiKeyScope.CREDENTIALS_WRITE, async (ctx) => {
        const { eventId, publicId } = await ids(params);
        const body = await request.json().catch(() => ({}));
        const action = z
            .enum(["generate", "regenerate", "revoke", "restore"])
            .default("generate")
            .parse(body.action || "generate");

        if (action === "revoke") {
            const data = await revokeCredential(
                ctx.workspaceId,
                eventId,
                publicId,
                body.reason
            );
            return publicOk(data);
        }
        if (action === "restore") {
            const data = await restoreCredential(
                ctx.workspaceId,
                eventId,
                publicId
            );
            return publicOk(data);
        }
        if (action === "regenerate") {
            const data = await regenerateCredential(
                ctx.workspaceId,
                eventId,
                publicId
            );
            return publicOk(data, 201);
        }

        const data = await createCredential(
            ctx.workspaceId,
            eventId,
            publicId,
            body.expiresAt ? { expiresAt: new Date(body.expiresAt) } : undefined
        );
        return publicOk(data, 201);
    });
}
