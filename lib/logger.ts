type LogMeta = Record<string, unknown>;

function formatMessage(level: string, message: string, meta?: LogMeta): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
}

/**
 * Minimal logger for unexpected / operational errors.
 * Keeps console usage consistent without introducing a heavy logging stack.
 */
export const logger = {
    info(message: string, meta?: LogMeta) {
        console.log(formatMessage("INFO", message, meta));
    },

    warn(message: string, meta?: LogMeta) {
        console.warn(formatMessage("WARN", message, meta));
    },

    error(message: string, error?: unknown, meta?: LogMeta) {
        const errorMeta: LogMeta = { ...meta };
        if (error instanceof Error) {
            errorMeta.name = error.name;
            errorMeta.message = error.message;
            if (process.env.NODE_ENV !== "production") {
                errorMeta.stack = error.stack;
            }
        } else if (error !== undefined) {
            errorMeta.error = String(error);
        }
        console.error(formatMessage("ERROR", message, errorMeta));
    },
};
