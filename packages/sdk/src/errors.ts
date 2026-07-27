export class QrezoError extends Error {
    readonly code: string;
    readonly status: number;
    readonly details?: unknown;

    constructor(
        message: string,
        options: { code: string; status: number; details?: unknown }
    ) {
        super(message);
        this.name = "QrezoError";
        this.code = options.code;
        this.status = options.status;
        this.details = options.details;
    }
}

export class QrezoAuthError extends QrezoError {
    constructor(message: string, status = 401) {
        super(message, { code: "unauthorized", status });
        this.name = "QrezoAuthError";
    }
}

export class QrezoPermissionError extends QrezoError {
    constructor(message: string, status = 403) {
        super(message, { code: "permission_denied", status });
        this.name = "QrezoPermissionError";
    }
}

export class QrezoRateLimitError extends QrezoError {
    constructor(message: string, status = 429) {
        super(message, { code: "rate_limit_exceeded", status });
        this.name = "QrezoRateLimitError";
    }
}

export class QrezoNotFoundError extends QrezoError {
    constructor(message: string, status = 404) {
        super(message, { code: "not_found", status });
        this.name = "QrezoNotFoundError";
    }
}

export class QrezoValidationError extends QrezoError {
    constructor(message: string, status = 400) {
        super(message, { code: "validation_error", status });
        this.name = "QrezoValidationError";
    }
}

export function errorFromResponse(
    status: number,
    body: { error?: { code?: string; message?: string } }
): QrezoError {
    const code = (body.error?.code || "internal_error").toLowerCase();
    const message = body.error?.message || `Request failed (${status})`;

    if (status === 401 || code === "unauthorized") {
        return new QrezoAuthError(message, status);
    }
    if (status === 403 || code === "permission_denied") {
        return new QrezoPermissionError(message, status);
    }
    if (status === 429 || code === "rate_limit_exceeded") {
        return new QrezoRateLimitError(message, status);
    }
    if (status === 404 || code === "not_found") {
        return new QrezoNotFoundError(message, status);
    }
    if (status === 400 || code === "validation_error") {
        return new QrezoValidationError(message, status);
    }
    return new QrezoError(message, { code, status });
}
