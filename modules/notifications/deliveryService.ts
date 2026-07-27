import crypto from "crypto";
import dbConnect from "@/config/dbConnect";
import NotificationDelivery from "@/models/NotificationDelivery";
import NotificationTemplate from "@/models/NotificationTemplate";
import {
    BadRequestError,
    NotFoundError,
} from "@/core/errors/AppError";
import {
    NotificationChannel,
    NotificationDeliveryStatus,
    type NotificationChannelValue,
    type NotificationDeliveryStatusValue,
    type NotificationTriggerEventValue,
} from "@/modules/notifications/constants";
import {
    buildVariableMap,
    renderTemplate,
} from "@/modules/notifications/templateEngine";
import { deliverNotification } from "@/modules/notifications/deliveryRunner";
import type { PublicNotificationDelivery } from "@/modules/notifications/types";
import { resolveProviderForChannel } from "@/modules/notifications/providers";

function toPublic(
    doc: {
        publicId: string;
        workspaceId: { toString(): string } | string;
        templateId: { toString(): string } | string;
        attendeeId?: string | null;
        channel: NotificationChannelValue;
        provider: string;
        triggerEvent: NotificationTriggerEventValue;
        status: NotificationDeliveryStatusValue;
        recipient: string;
        subject?: string;
        renderedContent: string;
        error?: string | null;
        attempts: number;
        providerMessageId?: string | null;
        durationMs?: number | null;
        deliveredAt?: Date | null;
        nextRetryAt?: Date | null;
        createdAt: Date;
    },
    templateName: string,
    templatePublicId: string
): PublicNotificationDelivery {
    return {
        id: doc.publicId,
        publicId: doc.publicId,
        workspaceId: String(doc.workspaceId),
        templateId: templatePublicId,
        templateName,
        attendeeId: doc.attendeeId ?? null,
        channel: doc.channel,
        provider: doc.provider as PublicNotificationDelivery["provider"],
        triggerEvent: doc.triggerEvent,
        status: doc.status,
        recipient: doc.recipient,
        subject: doc.subject || "",
        renderedContent: doc.renderedContent,
        error: doc.error ?? null,
        attempts: doc.attempts,
        providerMessageId: doc.providerMessageId ?? null,
        durationMs: doc.durationMs ?? null,
        deliveredAt: doc.deliveredAt
            ? doc.deliveredAt.toISOString()
            : null,
        nextRetryAt: doc.nextRetryAt
            ? doc.nextRetryAt.toISOString()
            : null,
        createdAt: doc.createdAt.toISOString(),
    };
}

export async function listNotificationDeliveries(input: {
    workspaceId: string;
    templateId?: string;
    channel?: NotificationChannelValue;
    status?: NotificationDeliveryStatusValue;
    triggerEvent?: NotificationTriggerEventValue;
    q?: string;
    page?: number;
    limit?: number;
}) {
    await dbConnect();
    const page = input.page || 1;
    const limit = input.limit || 25;
    const filter: Record<string, unknown> = {
        workspaceId: input.workspaceId,
    };

    if (input.templateId) {
        const tpl = await NotificationTemplate.findOne({
            workspaceId: input.workspaceId,
            publicId: input.templateId,
        })
            .select("_id")
            .lean();
        if (!tpl) {
            return {
                items: [] as PublicNotificationDelivery[],
                pagination: { page, limit, total: 0, totalPages: 1 },
            };
        }
        filter.templateId = tpl._id;
    }
    if (input.channel) filter.channel = input.channel;
    if (input.status) filter.status = input.status;
    if (input.triggerEvent) filter.triggerEvent = input.triggerEvent;
    if (input.q) {
        filter.$or = [
            { publicId: { $regex: input.q, $options: "i" } },
            { recipient: { $regex: input.q, $options: "i" } },
            { error: { $regex: input.q, $options: "i" } },
            { subject: { $regex: input.q, $options: "i" } },
        ];
    }

    const [total, rows] = await Promise.all([
        NotificationDelivery.countDocuments(filter),
        NotificationDelivery.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
    ]);

    const tplIds = [...new Set(rows.map((r) => String(r.templateId)))];
    const templates = await NotificationTemplate.find({
        _id: { $in: tplIds },
    })
        .select("name publicId")
        .lean();
    const byOid = new Map(
        templates.map((t) => [String(t._id), t] as const)
    );

    return {
        items: rows.map((r) => {
            const tpl = byOid.get(String(r.templateId));
            return toPublic(
                r as never,
                tpl?.name || "Template",
                tpl?.publicId || ""
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

export async function getNotificationDelivery(
    workspaceId: string,
    publicId: string
): Promise<PublicNotificationDelivery> {
    await dbConnect();
    const doc = await NotificationDelivery.findOne({
        workspaceId,
        publicId,
    }).lean();
    if (!doc) throw new NotFoundError("Delivery not found");
    const tpl = await NotificationTemplate.findById(doc.templateId)
        .select("name publicId")
        .lean();
    return toPublic(
        doc as never,
        tpl?.name || "Template",
        tpl?.publicId || ""
    );
}

export async function retryNotificationDelivery(
    workspaceId: string,
    publicId: string
): Promise<PublicNotificationDelivery> {
    await dbConnect();
    const doc = await NotificationDelivery.findOne({
        workspaceId,
        publicId,
    });
    if (!doc) throw new NotFoundError("Delivery not found");
    if (doc.status === NotificationDeliveryStatus.DELIVERED) {
        throw new BadRequestError("Already delivered");
    }

    doc.status = NotificationDeliveryStatus.PENDING;
    doc.nextRetryAt = null;
    doc.error = null;
    await doc.save();

    void deliverNotification(doc._id.toString());

    const tpl = await NotificationTemplate.findById(doc.templateId)
        .select("name publicId")
        .lean();
    return toPublic(
        doc.toObject() as never,
        tpl?.name || "Template",
        tpl?.publicId || ""
    );
}

export function previewNotification(input: {
    subject?: string;
    content: string;
    channel?: NotificationChannelValue;
    variables?: Record<string, unknown>;
}) {
    const vars = buildVariableMap(input.variables || {});
    return {
        subject: renderTemplate(input.subject || "", vars),
        content: renderTemplate(input.content, vars),
        variablesUsed: vars,
    };
}

/** Test-send using an existing template (required). */
export async function sendTestNotification(input: {
    workspaceId: string;
    templateId: string;
    recipient: string;
    variables?: Record<string, unknown>;
}): Promise<PublicNotificationDelivery> {
    await dbConnect();

    const tpl = await NotificationTemplate.findOne({
        workspaceId: input.workspaceId,
        publicId: input.templateId,
    });
    if (!tpl) throw new NotFoundError("Template not found");

    if (
        tpl.channel === NotificationChannel.EMAIL &&
        !input.recipient.includes("@")
    ) {
        throw new BadRequestError("Recipient must be an email address");
    }

    const vars = buildVariableMap(input.variables || {});
    const renderedSubject = renderTemplate(tpl.subject || "", vars);
    const renderedContent = renderTemplate(tpl.content, vars);
    const provider = resolveProviderForChannel(tpl.channel);

    const doc = await NotificationDelivery.create({
        publicId: `ndel_${crypto.randomBytes(6).toString("hex")}`,
        workspaceId: input.workspaceId,
        templateId: tpl._id,
        attendeeId: null,
        channel: tpl.channel,
        provider: provider.id,
        triggerEvent: tpl.triggerEvent,
        status: NotificationDeliveryStatus.PENDING,
        recipient: input.recipient,
        subject: renderedSubject,
        renderedContent,
        attempts: 0,
    });

    void deliverNotification(doc._id.toString());

    return toPublic(doc.toObject() as never, tpl.name, tpl.publicId);
}
