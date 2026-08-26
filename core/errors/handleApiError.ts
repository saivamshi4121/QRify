import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/core/errors/AppError";
import { logger } from "@/lib/logger";

/**
 * Maps known errors to consistent API responses without leaking internals.
 * Preserves the existing `{ success: false, message }` response shape.
 */
export function handleApiError(error: unknown, context = "API Error") {
    if (error instanceof AppError) {
        return NextResponse.json(
            {
                success: false,
                message: error.message,
                code: error.code,
                ...(error.details !== undefined && { details: error.details }),
            },
            { status: error.statusCode }
        );
    }

    if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid request data";
        return NextResponse.json(
            { success: false, message },
            { status: 400 }
        );
    }

    logger.error(context, error);

    return NextResponse.json(
        { success: false, message: "Internal Server Error" },
        { status: 500 }
    );
}
