import dbConnect from "@/config/dbConnect";
import WebhookDelivery from "@/models/WebhookDelivery";
import WebhookEndpoint from "@/models/WebhookEndpoint";
import {
    BadRequestError,
    NotFoundError,
} from "@/core/errors/AppError";
import {
    WebhookDeliveryStatus,
    type WebhookDeliveryStatusValue,
    type WebhookEventTypeValue,
} from "@/modules/webhooks/constants";
import { deliverWebhook } from "@/modules/webhooks/deliveryRunner";
import { generateDeliveryPublicId } from "@/modules/webhooks/signing";
import type { PublicWebhookDelivery } from "@/modules/webhooks/types";
import crypto from "crypto";

function toPublicDelivery(
    doc: {
        publicId: string;
        webhookId: { toString(): string } | string;
        eventType: WebhookEventTypeValue;
        status: WebhookDeliveryStatusValue;
        attempt: number;
        responseCode?: number | null;
        responseBody?: string | null;
        durationMs?: number | null;
        errorMessage?: string | null;
        deliveredAt?: Date | null;
        nextRetryAt?: Date | null;
        createdAt: Date;
        payload: Record<string, unknown>;
    },
    webhookPublicId: string,
    webhookName: string
): PublicWebhookDelivery {
    return {
        id: doc.publicId,
        publicId: doc.publicId,
        webhookId: webhookPublicId,
        webhookName,
        eventType: doc.eventType,
        status: doc.status,
        attempt: doc.attempt,
        responseCode: doc.responseCode ?? null,
        responseBody: doc.responseBody ?? null,
        durationMs: doc.durationMs ?? null,
        errorMessage: doc.errorMessage ?? null,
        deliveredAt: doc.deliveredAt
            ? doc.deliveredAt.toISOString()
            : null,
        nextRetryAt: doc.nextRetryAt
            ? doc.nextRetryAt.toISOString()
            : null,
        createdAt: doc.createdAt.toISOString(),
        payload: doc.payload || {},
    };
}

export async function listWebhookDeliveries(input: {
    workspaceId: string;
    webhookId?: string;
    eventType?: WebhookEventTypeValue;
    status?: string;
    q?: string;
    page?: number;
    limit?: number;
}): Promise<{
    items: PublicWebhookDelivery[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}> {
    await dbConnect();
    const page = input.page || 1;
    const limit = input.limit || 25;
    const filter: Record<string, unknown> = {
        workspaceId: input.workspaceId,
    };

    if (input.webhookId) {
        const endpoint = await WebhookEndpoint.findOne({
            workspaceId: input.workspaceId,
            publicId: input.webhookId,
        })
            .select("_id")
            .lean();
        if (!endpoint) {
            return {
                items: [],
                pagination: { page, limit, total: 0, totalPages: 1 },
            };
        }
        filter.webhookId = endpoint._id;
    }
    if (input.eventType) filter.eventType = input.eventType;
    if (input.status) filter.status = input.status.toUpperCase();
    if (input.q) {
        filter.$or = [
            { publicId: { $regex: input.q, $options: "i" } },
            { eventType: { $regex: input.q, $options: "i" } },
            { errorMessage: { $regex: input.q, $options: "i" } },
        ];
    }

    const [total, rows] = await Promise.all([
        WebhookDelivery.countDocuments(filter),
        WebhookDelivery.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
    ]);

    const webhookIds = [...new Set(rows.map((r) => String(r.webhookId)))];
    const endpoints = await WebhookEndpoint.find({
        _id: { $in: webhookIds },
    })
        .select("publicId name")
        .lean();
    const map = new Map(
        endpoints.map((e) => [String(e._id), e] as const)
    );

    return {
        items: rows.map((r) => {
            const ep = map.get(String(r.webhookId));
            return toPublicDelivery(
                r as never,
                ep?.publicId || "",
                ep?.name || "Webhook"
            );
        }),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
}

export async function getWebhookDelivery(
    workspaceId: string,
    publicId: string
): Promise<PublicWebhookDelivery> {
    await dbConnect();
    const doc = await WebhookDelivery.findOne({
        workspaceId,
        publicId,
    }).lean();
    if (!doc) throw new NotFoundError("Delivery not found");
    const endpoint = await WebhookEndpoint.findById(doc.webhookId)
        .select("publicId name")
        .lean();
    return toPublicDelivery(
        doc as never,
        endpoint?.publicId || "",
        endpoint?.name || "Webhook"
    );
}

/**
 * Replay creates a NEW delivery row (history preserved) and queues it.
 */
export async function replayWebhookDelivery(
    workspaceId: string,
    deliveryPublicId: string
): Promise<PublicWebhookDelivery> {
    await dbConnect();
    const original = await WebhookDelivery.findOne({
        workspaceId,
        publicId: deliveryPublicId,
    });
    if (!original) throw new NotFoundError("Delivery not found");

    const endpoint = await WebhookEndpoint.findOne({
        _id: original.webhookId,
        workspaceId,
    });
    if (!endpoint) throw new NotFoundError("Webhook endpoint not found");
    if (!endpoint.enabled) {
        throw new BadRequestError("Cannot replay to a disabled endpoint");
    }

    let publicId = generateDeliveryPublicId();
    for (let i = 0; i < 5; i++) {
        const exists = await WebhookDelivery.findOne({ publicId })
            .select("_id")
            .lean();
        if (!exists) break;
        publicId = `whd_${crypto.randomBytes(6).toString("hex")}`;
    }

    const payload = {
        ...(original.payload as Record<string, unknown>),
        id: publicId,
        createdAt: new Date().toISOString(),
    };

    const replay = await WebhookDelivery.create({
        publicId,
        webhookId: original.webhookId,
        workspaceId,
        eventType: original.eventType,
        payload,
        status: WebhookDeliveryStatus.PENDING,
        attempt: 0,
        replayOf: original._id,
    });

    void deliverWebhook(replay._id.toString());

    return toPublicDelivery(
        replay.toObject() as never,
        endpoint.publicId,
        endpoint.name
    );
}
