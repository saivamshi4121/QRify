import crypto from "crypto";
import dbConnect from "@/config/dbConnect";
import NotificationTemplate from "@/models/NotificationTemplate";
import {
    BadRequestError,
    NotFoundError,
} from "@/core/errors/AppError";
import { NotificationChannel } from "@/modules/notifications/constants";
import { extractTemplateVariables } from "@/modules/notifications/templateEngine";
import type { PublicNotificationTemplate } from "@/modules/notifications/types";
import type {
    NotificationChannelValue,
    NotificationTriggerEventValue,
} from "@/modules/notifications/constants";
import { STARTER_TEMPLATES } from "@/modules/notifications/starters";

function generateTemplatePublicId() {
    return `ntpl_${crypto.randomBytes(6).toString("hex")}`;
}

async function uniqueTemplatePublicId(): Promise<string> {
    for (let i = 0; i < 8; i++) {
        const publicId = generateTemplatePublicId();
        const exists = await NotificationTemplate.findOne({ publicId })
            .select("_id")
            .lean();
        if (!exists) return publicId;
    }
    return `ntpl_${crypto.randomBytes(8).toString("hex")}`;
}

function toPublic(doc: {
    publicId: string;
    name: string;
    description?: string;
    channel: NotificationChannelValue;
    triggerEvent: NotificationTriggerEventValue;
    enabled: boolean;
    subject?: string;
    content: string;
    variables?: string[];
    createdAt: Date;
    updatedAt: Date;
}): PublicNotificationTemplate {
    return {
        id: doc.publicId,
        publicId: doc.publicId,
        name: doc.name,
        description: doc.description || "",
        channel: doc.channel,
        triggerEvent: doc.triggerEvent,
        enabled: doc.enabled,
        subject: doc.subject || "",
        content: doc.content,
        variables: doc.variables || [],
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export async function listNotificationTemplates(
    workspaceId: string
): Promise<PublicNotificationTemplate[]> {
    await dbConnect();
    const docs = await NotificationTemplate.find({ workspaceId })
        .sort({ createdAt: -1 })
        .lean();
    return docs.map((d) => toPublic(d as never));
}

export async function getNotificationTemplate(
    workspaceId: string,
    publicId: string
): Promise<PublicNotificationTemplate> {
    await dbConnect();
    const doc = await NotificationTemplate.findOne({
        workspaceId,
        publicId,
    }).lean();
    if (!doc) throw new NotFoundError("Notification template not found");
    return toPublic(doc as never);
}

export async function createNotificationTemplate(input: {
    workspaceId: string;
    userId: string;
    name: string;
    description?: string;
    channel: NotificationChannelValue;
    triggerEvent: NotificationTriggerEventValue;
    enabled?: boolean;
    subject?: string;
    content: string;
}): Promise<PublicNotificationTemplate> {
    await dbConnect();
    if (
        input.channel === NotificationChannel.EMAIL &&
        !(input.subject || "").trim()
    ) {
        throw new BadRequestError("Email templates require a subject");
    }
    const variables = extractTemplateVariables(
        `${input.subject || ""}\n${input.content}`
    );
    const doc = await NotificationTemplate.create({
        publicId: await uniqueTemplatePublicId(),
        workspaceId: input.workspaceId,
        name: input.name,
        description: input.description || "",
        channel: input.channel,
        triggerEvent: input.triggerEvent,
        enabled: input.enabled ?? true,
        subject: input.subject || "",
        content: input.content,
        variables,
        createdBy: input.userId,
    });
    return toPublic(doc.toObject() as never);
}

export async function updateNotificationTemplate(input: {
    workspaceId: string;
    publicId: string;
    name?: string;
    description?: string;
    channel?: NotificationChannelValue;
    triggerEvent?: NotificationTriggerEventValue;
    enabled?: boolean;
    subject?: string;
    content?: string;
}): Promise<PublicNotificationTemplate> {
    await dbConnect();
    const doc = await NotificationTemplate.findOne({
        workspaceId: input.workspaceId,
        publicId: input.publicId,
    });
    if (!doc) throw new NotFoundError("Notification template not found");

    if (input.name !== undefined) doc.name = input.name;
    if (input.description !== undefined) doc.description = input.description;
    if (input.channel !== undefined) doc.channel = input.channel;
    if (input.triggerEvent !== undefined) doc.triggerEvent = input.triggerEvent;
    if (input.enabled !== undefined) doc.enabled = input.enabled;
    if (input.subject !== undefined) doc.subject = input.subject;
    if (input.content !== undefined) doc.content = input.content;

    if (
        doc.channel === NotificationChannel.EMAIL &&
        !(doc.subject || "").trim()
    ) {
        throw new BadRequestError("Email templates require a subject");
    }

    doc.variables = extractTemplateVariables(
        `${doc.subject || ""}\n${doc.content}`
    );
    await doc.save();
    return toPublic(doc.toObject() as never);
}

export async function deleteNotificationTemplate(
    workspaceId: string,
    publicId: string
): Promise<{ deleted: boolean }> {
    await dbConnect();
    const result = await NotificationTemplate.deleteOne({
        workspaceId,
        publicId,
    });
    if (result.deletedCount === 0) {
        throw new NotFoundError("Notification template not found");
    }
    return { deleted: true };
}

/** Seed starter templates once per workspace (idempotent by name+trigger+channel). */
export async function ensureStarterTemplates(input: {
    workspaceId: string;
    userId: string;
}): Promise<number> {
    await dbConnect();
    let created = 0;
    for (const starter of STARTER_TEMPLATES) {
        const exists = await NotificationTemplate.findOne({
            workspaceId: input.workspaceId,
            name: starter.name,
            channel: starter.channel,
            triggerEvent: starter.triggerEvent,
        })
            .select("_id")
            .lean();
        if (exists) continue;
        await createNotificationTemplate({
            workspaceId: input.workspaceId,
            userId: input.userId,
            name: starter.name,
            description: starter.description,
            channel: starter.channel,
            triggerEvent: starter.triggerEvent,
            subject: starter.subject,
            content: starter.content,
            enabled: false,
        });
        created += 1;
    }
    return created;
}
