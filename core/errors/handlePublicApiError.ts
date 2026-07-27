import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/core/errors/AppError";
import { AppRateLimitError } from "@/modules/api-key/service";
import { logger } from "@/lib/logger";

/**
 * Public API error shape:
 * { success: false, error: { code, message } }
 */
export function handlePublicApiError(error: unknown, context = "Public API") {
    if (error instanceof AppRateLimitError) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                },
            },
            {
                status: 429,
                headers: { "Retry-After": "60" },
            }
        );
    }

    if (error instanceof AppError) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: error.code.toLowerCase(),
                    message: error.message,
                },
            },
            { status: error.statusCode }
        );
    }

    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "validation_error",
                    message: error.issues[0]?.message || "Invalid request data",
                },
            },
            { status: 400 }
        );
    }

    logger.error(context, error);

    return NextResponse.json(
        {
            success: false,
            error: {
                code: "internal_error",
                message: "Internal Server Error",
            },
        },
        { status: 500 }
    );
}

export function publicOk<T>(data: T, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
}
