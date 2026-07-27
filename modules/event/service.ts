import crypto from "crypto";
import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import Event from "@/models/Event";
import { WorkspaceRole } from "@/models/WorkspaceMember";
import {
    EVENT_MANAGE_ROLES,
    EventStatus,
    EventStatusValue,
} from "@/modules/event/constants";
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "@/core/errors/AppError";
import type { CreateEventInput, UpdateEventInput } from "@/modules/event/validation";

function slugify(input: string): string {
    const base = input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
    return base || "event";
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = slugify(base);
    let attempt = 0;
    while (attempt < 10) {
        const existing = await Event.findOne({
            slug,
            ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        })
            .select("_id")
            .lean();
        if (!existing) return slug;
        slug = `${slugify(base)}-${crypto.randomBytes(2).toString("hex")}`;
        attempt += 1;
    }
    return `${slugify(base)}-${Date.now().toString(36)}`;
}

export function assertCanManageEvents(role: WorkspaceRole) {
    if (!(EVENT_MANAGE_ROLES as readonly string[]).includes(role)) {
        throw new ForbiddenError(
            "Only workspace owners and admins can manage events"
        );
    }
}

export type ListEventsOptions = {
    q?: string;
    status?: EventStatusValue;
    sort?: "startDate_asc" | "startDate_desc" | "createdAt_desc";
};

export async function listEvents(
    workspaceId: string,
    options: ListEventsOptions = {}
) {
    await dbConnect();

    const filter: Record<string, unknown> = { workspaceId };
    if (options.status) filter.status = options.status;
    if (options.q) {
        filter.$or = [
            { name: { $regex: options.q, $options: "i" } },
            { venue: { $regex: options.q, $options: "i" } },
            { description: { $regex: options.q, $options: "i" } },
        ];
    }

    let sort: Record<string, 1 | -1> = { startDate: -1 };
    if (options.sort === "startDate_asc") sort = { startDate: 1 };
    if (options.sort === "startDate_desc") sort = { startDate: -1 };
    if (options.sort === "createdAt_desc") sort = { createdAt: -1 };

    return Event.find(filter).sort(sort).lean();
}

export async function getEventForWorkspace(
    eventId: string,
    workspaceId: string
) {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new BadRequestError("Invalid event ID");
    }
    const event = await Event.findOne({ _id: eventId, workspaceId }).lean();
    if (!event) throw new NotFoundError("Event not found");
    return event;
}

export async function createEvent(
    workspaceId: string,
    userId: string,
    input: CreateEventInput
) {
    await dbConnect();

    const slug = input.slug
        ? await uniqueSlug(input.slug)
        : await uniqueSlug(input.name);

    const doc = await Event.create({
        workspaceId,
        createdBy: userId,
        name: input.name,
        slug,
        description: input.description || "",
        logo: input.logo || "",
        banner: input.banner || "",
        venue: input.venue || "",
        timezone: input.timezone,
        startDate: input.startDate,
        endDate: input.endDate,
        status: input.status || EventStatus.DRAFT,
    });

    const { publishDomainEvent, WebhookEventType } = await import(
        "@/modules/webhooks"
    );
    void publishDomainEvent({
        workspaceId,
        type: WebhookEventType.EVENT_CREATED,
        data: {
            id: String(doc._id),
            name: doc.name,
            slug: doc.slug,
            status: doc.status,
            startDate: doc.startDate,
            endDate: doc.endDate,
        },
    });

    return doc;
}

export async function updateEvent(
    eventId: string,
    workspaceId: string,
    input: UpdateEventInput
) {
    await dbConnect();
    const event = await Event.findOne({ _id: eventId, workspaceId });
    if (!event) throw new NotFoundError("Event not found");

    if (input.name !== undefined) event.name = input.name;
    if (input.description !== undefined) event.description = input.description;
    if (input.logo !== undefined) event.logo = input.logo;
    if (input.banner !== undefined) event.banner = input.banner;
    if (input.venue !== undefined) event.venue = input.venue;
    if (input.timezone !== undefined) event.timezone = input.timezone;
    if (input.startDate !== undefined) event.startDate = input.startDate;
    if (input.endDate !== undefined) event.endDate = input.endDate;
    if (input.status !== undefined) event.status = input.status;

    if (input.slug) {
        const nextSlug = await uniqueSlug(input.slug, String(event._id));
        const clash = await Event.findOne({
            slug: nextSlug,
            _id: { $ne: event._id },
        })
            .select("_id")
            .lean();
        if (clash) throw new BadRequestError("Slug already in use");
        event.slug = nextSlug;
    }

    const start = event.startDate;
    const end = event.endDate;
    if (end < start) {
        throw new BadRequestError("End date must be on or after start date");
    }

    await event.save();

    const { publishDomainEvent, WebhookEventType } = await import(
        "@/modules/webhooks"
    );
    void publishDomainEvent({
        workspaceId,
        type: WebhookEventType.EVENT_UPDATED,
        data: {
            id: String(event._id),
            name: event.name,
            slug: event.slug,
            status: event.status,
            startDate: event.startDate,
            endDate: event.endDate,
        },
    });

    return event;
}

export async function archiveEvent(eventId: string, workspaceId: string) {
    return updateEvent(eventId, workspaceId, { status: EventStatus.ARCHIVED });
}

export async function deleteEvent(eventId: string, workspaceId: string) {
    await dbConnect();
    const event = await Event.findOne({ _id: eventId, workspaceId });
    if (!event) throw new NotFoundError("Event not found");
    await Event.deleteOne({ _id: event._id });

    const { publishDomainEvent, WebhookEventType } = await import(
        "@/modules/webhooks"
    );
    void publishDomainEvent({
        workspaceId,
        type: WebhookEventType.EVENT_DELETED,
        data: {
            id: String(event._id),
            name: event.name,
            slug: event.slug,
        },
    });

    return { deleted: true };
}
