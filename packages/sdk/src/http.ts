import { errorFromResponse, QrezoError } from "./errors";
import type { QrezoClientOptions } from "./types";

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
    success: false;
    error?: { code?: string; message?: string };
};

export class HttpClient {
    readonly apiKey: string;
    readonly baseUrl: string;
    private readonly fetchImpl: typeof fetch;

    constructor(options: QrezoClientOptions) {
        if (!options.apiKey?.trim()) {
            throw new QrezoError("apiKey is required", {
                code: "validation_error",
                status: 400,
            });
        }
        this.apiKey = options.apiKey.trim();
        this.baseUrl = (options.baseUrl || "").replace(/\/$/, "");
        this.fetchImpl = options.fetch || fetch;
    }

    async request<T>(
        method: string,
        path: string,
        body?: unknown
    ): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const res = await this.fetchImpl(url, {
            method,
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                Accept: "application/json",
                ...(body !== undefined
                    ? { "Content-Type": "application/json" }
                    : {}),
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        const text = await res.text();
        let json: ApiSuccess<T> | ApiFailure | null = null;
        try {
            json = text ? (JSON.parse(text) as ApiSuccess<T> | ApiFailure) : null;
        } catch {
            throw new QrezoError(
                text || `Invalid JSON response (${res.status})`,
                { code: "internal_error", status: res.status }
            );
        }

        if (!res.ok || !json || json.success === false) {
            throw errorFromResponse(
                res.status,
                (json as ApiFailure) || {
                    error: { message: `HTTP ${res.status}` },
                }
            );
        }

        return (json as ApiSuccess<T>).data;
    }

    get<T>(path: string) {
        return this.request<T>("GET", path);
    }

    post<T>(path: string, body?: unknown) {
        return this.request<T>("POST", path, body ?? {});
    }

    patch<T>(path: string, body: unknown) {
        return this.request<T>("PATCH", path, body);
    }

    delete<T>(path: string) {
        return this.request<T>("DELETE", path);
    }
}
