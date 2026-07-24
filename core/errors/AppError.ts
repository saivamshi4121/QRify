export class AppError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = "AppError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class BadRequestError extends AppError {
    constructor(message = "Bad Request", details?: unknown) {
        super(400, "BAD_REQUEST", message, details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(401, "UNAUTHORIZED", message);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden") {
        super(403, "FORBIDDEN", message);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Not Found") {
        super(404, "NOT_FOUND", message);
    }
}
