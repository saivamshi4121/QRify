import crypto from "crypto";
import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import Attendee from "@/models/Attendee";
import {
    RegistrationSource,
    RegistrationStatus,
} from "@/modules/attendee/constants";
import type {
    CreateAttendeeInput,
    CsvColumnMap,
    ListAttendeesQuery,
    UpdateAttendeeInput,
} from "@/modules/attendee/validation";
import { getEventForWorkspace } from "@/modules/event/service";
import { BadRequestError, NotFoundError } from "@/core/errors/AppError";

export type PublicAttendee = {
    id: string;
    publicId: string;
    externalId: string | null;
    registrationSource: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    designation: string;
    ticketType: string;
    registrationStatus: string;
    notes: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
};

function generatePublicId(): string {
    return `att_${crypto.randomBytes(4).toString("hex")}`;
}

async function uniquePublicId(): Promise<string> {
    for (let i = 0; i < 8; i++) {
        const publicId = generatePublicId();
        const exists = await Attendee.findOne({ publicId }).select("_id").lean();
        if (!exists) return publicId;
    }
    return `att_${crypto.randomBytes(8).toString("hex")}`;
}

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

export function toPublicAttendee(doc: {
    publicId: string;
    externalId?: string | null;
    registrationSource: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    designation?: string;
    ticketType: string;
    registrationStatus: string;
    notes?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}): PublicAttendee {
    return {
        id: doc.publicId,
        publicId: doc.publicId,
        externalId: doc.externalId ?? null,
        registrationSource: doc.registrationSource,
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: doc.email,
        phone: doc.phone || "",
        company: doc.company || "",
        designation: doc.designation || "",
        ticketType: doc.ticketType,
        registrationStatus: doc.registrationStatus,
        notes: doc.notes || "",
        metadata: (doc.metadata as Record<string, unknown>) || {},
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}

async function assertEventInWorkspace(eventId: string, workspaceId: string) {
    return getEventForWorkspace(eventId, workspaceId);
}

async function assertUniqueEmail(
    eventId: string,
    email: string,
    excludePublicId?: string
) {
    const normalized = normalizeEmail(email);
    const existing = await Attendee.findOne({
        eventId,
        email: normalized,
        ...(excludePublicId ? { publicId: { $ne: excludePublicId } } : {}),
    })
        .select("publicId")
        .lean();
    if (existing) {
        throw new BadRequestError(
            "An attendee with this email already exists for this event"
        );
    }
    return normalized;
}

export async function listAttendees(
    workspaceId: string,
    eventId: string,
    query: ListAttendeesQuery
) {
    await dbConnect();
    await assertEventInWorkspace(eventId, workspaceId);

    const filter: Record<string, unknown> = {
        workspaceId,
        eventId,
    };

    if (query.status) filter.registrationStatus = query.status;
    if (query.source) filter.registrationSource = query.source;
    if (query.ticketType) filter.ticketType = query.ticketType;

    if (query.q) {
        const q = query.q.trim();
        filter.$or = [
            { firstName: { $regex: q, $options: "i" } },
            { lastName: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
            { company: { $regex: q, $options: "i" } },
            { phone: { $regex: q, $options: "i" } },
            { publicId: { $regex: q, $options: "i" } },
        ];
    }

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sort === "createdAt_asc") sort = { createdAt: 1 };
    if (query.sort === "createdAt_desc") sort = { createdAt: -1 };
    if (query.sort === "name_asc") sort = { firstName: 1, lastName: 1 };
    if (query.sort === "name_desc") sort = { firstName: -1, lastName: -1 };
    if (query.sort === "email_asc") sort = { email: 1 };

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [total, rows] = await Promise.all([
        Attendee.countDocuments(filter),
        Attendee.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ]);

    return {
        items: rows.map(toPublicAttendee),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
}

export async function searchAttendees(
    workspaceId: string,
    eventId: string,
    q: string,
    limit = 20
) {
    return listAttendees(workspaceId, eventId, {
        q,
        page: 1,
        limit,
        sort: "name_asc",
    });
}

export async function getAttendee(
    workspaceId: string,
    eventId: string,
    publicId: string
) {
    await dbConnect();
    await assertEventInWorkspace(eventId, workspaceId);

    const attendee = await Attendee.findOne({
        workspaceId,
        eventId,
        publicId,
    }).lean();

    if (!attendee) throw new NotFoundError("Attendee not found");
    return toPublicAttendee(attendee);
}

export async function createAttendee(
    workspaceId: string,
    eventId: string,
    input: CreateAttendeeInput
) {
    await dbConnect();
    await assertEventInWorkspace(eventId, workspaceId);

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new BadRequestError("Invalid event ID");
    }

    const email = await assertUniqueEmail(eventId, input.email);
    const publicId = await uniquePublicId();

    const doc = await Attendee.create({
        publicId,
        workspaceId,
        eventId,
        externalId: input.externalId ?? null,
        registrationSource:
            input.registrationSource || RegistrationSource.MANUAL,
        firstName: input.firstName,
        lastName: input.lastName,
        email,
        phone: input.phone || "",
        company: input.company || "",
        designation: input.designation || "",
        ticketType: input.ticketType || "General",
        registrationStatus:
            input.registrationStatus || RegistrationStatus.REGISTERED,
        notes: input.notes || "",
        metadata: input.metadata || {},
    });

    const publicAttendee = toPublicAttendee(doc.toObject());

    const { publishDomainEvent, WebhookEventType } = await import(
        "@/modules/webhooks"
    );
    void publishDomainEvent({
        workspaceId,
        type: WebhookEventType.ATTENDEE_CREATED,
        data: { eventId, ...publicAttendee },
    });

    return publicAttendee;
}

export async function updateAttendee(
    workspaceId: string,
    eventId: string,
    publicId: string,
    input: UpdateAttendeeInput
) {
    await dbConnect();
    await assertEventInWorkspace(eventId, workspaceId);

    const attendee = await Attendee.findOne({
        workspaceId,
        eventId,
        publicId,
    });
    if (!attendee) throw new NotFoundError("Attendee not found");

    if (input.email !== undefined) {
        attendee.email = await assertUniqueEmail(
            eventId,
            input.email,
            publicId
        );
    }
    if (input.firstName !== undefined) attendee.firstName = input.firstName;
    if (input.lastName !== undefined) attendee.lastName = input.lastName;
    if (input.phone !== undefined) attendee.phone = input.phone || "";
    if (input.company !== undefined) attendee.company = input.company;
    if (input.designation !== undefined)
        attendee.designation = input.designation;
    if (input.ticketType !== undefined) attendee.ticketType = input.ticketType;
    if (input.registrationSource !== undefined)
        attendee.registrationSource = input.registrationSource;
    if (input.registrationStatus !== undefined)
        attendee.registrationStatus = input.registrationStatus;
    if (input.notes !== undefined) attendee.notes = input.notes;
    if (input.externalId !== undefined)
        attendee.externalId = input.externalId;
    if (input.metadata !== undefined) attendee.metadata = input.metadata;

    await attendee.save();
    const publicAttendee = toPublicAttendee(attendee.toObject());

    const { publishDomainEvent, WebhookEventType } = await import(
        "@/modules/webhooks"
    );
    void publishDomainEvent({
        workspaceId,
        type: WebhookEventType.ATTENDEE_UPDATED,
        data: { eventId, ...publicAttendee },
    });

    return publicAttendee;
}

export async function deleteAttendee(
    workspaceId: string,
    eventId: string,
    publicId: string
) {
    await dbConnect();
    await assertEventInWorkspace(eventId, workspaceId);

    const result = await Attendee.deleteOne({
        workspaceId,
        eventId,
        publicId,
    });
    if (result.deletedCount === 0) throw new NotFoundError("Attendee not found");

    const { publishDomainEvent, WebhookEventType } = await import(
        "@/modules/webhooks"
    );
    void publishDomainEvent({
        workspaceId,
        type: WebhookEventType.ATTENDEE_DELETED,
        data: { eventId, publicId, id: publicId },
    });

    return { deleted: true, publicId };
}

export async function deleteAttendeesBulk(
    workspaceId: string,
    eventId: string,
    publicIds: string[]
) {
    await dbConnect();
    await assertEventInWorkspace(eventId, workspaceId);

    const result = await Attendee.deleteMany({
        workspaceId,
        eventId,
        publicId: { $in: publicIds },
    });
    return { deleted: result.deletedCount };
}

function cell(row: string[], headers: string[], column?: string) {
    if (!column) return "";
    const idx = headers.indexOf(column);
    if (idx < 0) return "";
    return (row[idx] || "").trim();
}

function splitName(full: string): { firstName: string; lastName: string } {
    const parts = full.trim().split(/\s+/);
    if (parts.length === 0) return { firstName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "-" };
    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(" "),
    };
}

function mapRowToInput(
    row: string[],
    headers: string[],
    columnMap: CsvColumnMap
): CreateAttendeeInput | { error: string } {
    let firstName = cell(row, headers, columnMap.firstName);
    let lastName = cell(row, headers, columnMap.lastName);
    if ((!firstName || !lastName) && columnMap.name) {
        const split = splitName(cell(row, headers, columnMap.name));
        if (!firstName) firstName = split.firstName;
        if (!lastName) lastName = split.lastName;
    }

    const email = cell(row, headers, columnMap.email);
    if (!email) return { error: "Email is required" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { error: "Invalid email" };
    }

    if (!firstName) return { error: "First name is required" };
    if (!lastName) lastName = "-";

    const phone = cell(row, headers, columnMap.phone);
    if (phone && !/^[+0-9()\-\s]*$/.test(phone)) {
        return { error: "Invalid phone" };
    }

    return {
        firstName,
        lastName,
        email,
        phone: phone || "",
        company: cell(row, headers, columnMap.company) || "",
        designation: cell(row, headers, columnMap.designation) || "",
        ticketType: cell(row, headers, columnMap.ticketType) || "General",
        registrationSource: RegistrationSource.CSV,
        registrationStatus: RegistrationStatus.REGISTERED,
        notes: "",
    };
}

export type BulkPreviewRow = {
    index: number;
    valid: boolean;
    error?: string;
    data?: CreateAttendeeInput;
};

export async function bulkImportPreview(
    workspaceId: string,
    eventId: string,
    input: { headers: string[]; rows: string[][]; columnMap: CsvColumnMap }
) {
    await dbConnect();
    await assertEventInWorkspace(eventId, workspaceId);

    const existingEmails = new Set(
        (
            await Attendee.find({ workspaceId, eventId })
                .select("email")
                .lean()
        ).map((a) => a.email)
    );

    const seenInFile = new Set<string>();
    const preview: BulkPreviewRow[] = [];

    for (let i = 0; i < input.rows.length; i++) {
        const mapped = mapRowToInput(
            input.rows[i],
            input.headers,
            input.columnMap
        );
        if ("error" in mapped) {
            preview.push({ index: i, valid: false, error: mapped.error });
            continue;
        }
        const email = normalizeEmail(mapped.email);
        if (seenInFile.has(email)) {
            preview.push({
                index: i,
                valid: false,
                error: "Duplicate email in file",
            });
            continue;
        }
        if (existingEmails.has(email)) {
            preview.push({
                index: i,
                valid: false,
                error: "Email already registered for this event",
            });
            continue;
        }
        seenInFile.add(email);
        preview.push({ index: i, valid: true, data: { ...mapped, email } });
    }

    return {
        total: preview.length,
        valid: preview.filter((r) => r.valid).length,
        invalid: preview.filter((r) => !r.valid).length,
        rows: preview,
    };
}

export async function bulkImport(
    workspaceId: string,
    eventId: string,
    input: { headers: string[]; rows: string[][]; columnMap: CsvColumnMap }
) {
    const preview = await bulkImportPreview(workspaceId, eventId, input);
    const created: PublicAttendee[] = [];
    const failed: { index: number; error: string }[] = [];

    for (const row of preview.rows) {
        if (!row.valid || !row.data) {
            failed.push({
                index: row.index,
                error: row.error || "Invalid row",
            });
            continue;
        }
        try {
            const attendee = await createAttendee(
                workspaceId,
                eventId,
                {
                    ...row.data,
                    registrationSource: RegistrationSource.CSV,
                }
            );
            created.push(attendee);
        } catch (e) {
            failed.push({
                index: row.index,
                error: e instanceof Error ? e.message : "Import failed",
            });
        }
    }

    return {
        created: created.length,
        failed: failed.length,
        attendees: created,
        errors: failed,
    };
}
