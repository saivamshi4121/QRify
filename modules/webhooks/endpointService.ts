import crypto from "crypto";
import dbConnect from "@/config/dbConnect";
import WebhookEndpoint from "@/models/WebhookEndpoint";
import {
    BadRequestError,
    NotFoundError,
} from "@/core/errors/AppError";
import {
    generateWebhookPublicId,
    generateWebhookSecret,
    secretPrefix,
} from "@/modules/webhooks/signing";
import { normalizeRetryPolicy } from "@/modules/webhooks/validation";
import type {
    CreatedWebhookEndpoint,
    PublicWebhookEndpoint,
    RetryPolicy,
} from "@/modules/webhooks/types";
import type { WebhookEventTypeValue } from "@/modules/webhooks/constants";

async function uniqueEndpointPublicId(): Promise<string> {
    for (let i = 0; i < 8; i++) {
        const publicId = generateWebhookPublicId();
        const exists = await WebhookEndpoint.findOne({ publicId })
            .select("_id")
            .lean();
        if (!exists) return publicId;
    }
    return `wh_${crypto.randomBytes(8).toString("hex")}`;
}

function toPublicEndpoint(doc: {
    publicId: string;
    name: string;
    description?: string;
    url: string;
    enabled: boolean;
    eventTypes: WebhookEventTypeValue[];
    retryPolicy: RetryPolicy;
    timeoutMs: number;
    secret?: string;
    createdAt: Date;
    updatedAt: Date;
}): PublicWebhookEndpoint {
    return {
        id: doc.publicId,
        publicId: doc.publicId,
        name: doc.name,
        description: doc.description || "",
        url: doc.url,
        enabled: doc.enabled,
        eventTypes: doc.eventTypes || [],
        retryPolicy: {
            maxAttempts: doc.retryPolicy.maxAttempts,
            scheduleSeconds: doc.retryPolicy.scheduleSeconds,
        },
        timeoutMs: doc.timeoutMs,
        secretPrefix: doc.secret ? secretPrefix(doc.secret) : "whsec_••••",
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export async function createWebhookEndpoint(input: {
    workspaceId: string;
    userId: string;
    name: string;
    description?: string;
    url: string;
    enabled?: boolean;
    eventTypes: WebhookEventTypeValue[];
    retryPolicy?: { maxAttempts?: number; scheduleSeconds?: number[] };
    timeoutMs?: number;
}): Promise<CreatedWebhookEndpoint> {
    await dbConnect();
    if (!input.url.startsWith("https://") && !input.url.startsWith("http://")) {
        throw new BadRequestError("Webhook URL must be http(s)");
    }
    const secret = generateWebhookSecret();
    const doc = await WebhookEndpoint.create({
        publicId: await uniqueEndpointPublicId(),
        workspaceId: input.workspaceId,
        name: input.name,
        description: input.description || "",
        url: input.url,
        secret,
        enabled: input.enabled ?? true,
        eventTypes: input.eventTypes,
        retryPolicy: normalizeRetryPolicy(input.retryPolicy),
        timeoutMs: input.timeoutMs,
        createdBy: input.userId,
    });
    const obj = doc.toObject();
    return {
        ...toPublicEndpoint({ ...obj, secret }),
        secret,
    };
}

export async function listWebhookEndpoints(
    workspaceId: string
): Promise<PublicWebhookEndpoint[]> {
    await dbConnect();
    const docs = await WebhookEndpoint.find({ workspaceId })
        .sort({ createdAt: -1 })
        .lean();
    return docs.map((d) => toPublicEndpoint(d as never));
}

export async function getWebhookEndpoint(
    workspaceId: string,
    publicId: string
): Promise<PublicWebhookEndpoint> {
    await dbConnect();
    const doc = await WebhookEndpoint.findOne({ workspaceId, publicId }).lean();
    if (!doc) throw new NotFoundError("Webhook endpoint not found");
    return toPublicEndpoint(doc as never);
}

export async function updateWebhookEndpoint(input: {
    workspaceId: string;
    publicId: string;
    name?: string;
    description?: string;
    url?: string;
    enabled?: boolean;
    eventTypes?: WebhookEventTypeValue[];
    retryPolicy?: { maxAttempts?: number; scheduleSeconds?: number[] };
    timeoutMs?: number;
}): Promise<PublicWebhookEndpoint> {
    await dbConnect();
    const doc = await WebhookEndpoint.findOne({
        workspaceId: input.workspaceId,
        publicId: input.publicId,
    });
    if (!doc) throw new NotFoundError("Webhook endpoint not found");

    if (input.name !== undefined) doc.name = input.name;
    if (input.description !== undefined) doc.description = input.description;
    if (input.url !== undefined) doc.url = input.url;
    if (input.enabled !== undefined) doc.enabled = input.enabled;
    if (input.eventTypes !== undefined) doc.eventTypes = input.eventTypes;
    if (input.retryPolicy !== undefined) {
        doc.retryPolicy = normalizeRetryPolicy({
            maxAttempts:
                input.retryPolicy.maxAttempts ?? doc.retryPolicy.maxAttempts,
            scheduleSeconds:
                input.retryPolicy.scheduleSeconds ??
                doc.retryPolicy.scheduleSeconds,
        });
    }
    if (input.timeoutMs !== undefined) doc.timeoutMs = input.timeoutMs;

    await doc.save();
    return toPublicEndpoint(doc.toObject() as never);
}

export async function deleteWebhookEndpoint(
    workspaceId: string,
    publicId: string
): Promise<{ deleted: boolean }> {
    await dbConnect();
    const result = await WebhookEndpoint.deleteOne({
        workspaceId,
        publicId,
    });
    if (result.deletedCount === 0) {
        throw new NotFoundError("Webhook endpoint not found");
    }
    return { deleted: true };
}

export async function rotateWebhookSecret(
    workspaceId: string,
    publicId: string
): Promise<CreatedWebhookEndpoint> {
    await dbConnect();
    const doc = await WebhookEndpoint.findOne({
        workspaceId,
        publicId,
    }).select("+secret");
    if (!doc) throw new NotFoundError("Webhook endpoint not found");
    const secret = generateWebhookSecret();
    doc.secret = secret;
    await doc.save();
    return {
        ...toPublicEndpoint({ ...doc.toObject(), secret }),
        secret,
    };
}
