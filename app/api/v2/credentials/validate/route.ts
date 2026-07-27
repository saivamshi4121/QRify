import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/core/errors/handleApiError";
import { validateCredentialQuerySchema } from "@/modules/event-credential/validation";
import { validateCredential } from "@/modules/event-credential/service";

/**
 * Public validation endpoint — Scanner / SDK will reuse validateCredential().
 * Does not expose Mongo IDs or raw tokens in the response.
 */
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const { token } = validateCredentialQuerySchema.parse({
            token: url.searchParams.get("token") || "",
        });
        const result = await validateCredential(token);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        return handleApiError(error, "Validate Credential Error");
    }
}
