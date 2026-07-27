import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiKey } from "@/core/api-key/withApiKey";
import { publicOk } from "@/core/errors/handlePublicApiError";
import { ApiKeyScope } from "@/modules/api-key/constants";
import { validateCredential } from "@/modules/event-credential/service";

const schema = z.object({
    token: z.string().trim().min(1),
});

/** Standalone credential token validation (no event context required). */
export async function POST(request: NextRequest) {
    return withApiKey(request, ApiKeyScope.CREDENTIALS_READ, async () => {
        const body = await request.json();
        const { token } = schema.parse(body);
        const data = await validateCredential(token);
        return publicOk(data);
    });
}
