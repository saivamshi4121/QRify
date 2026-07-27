import crypto from "crypto";
import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import AccessEvent from "@/models/AccessEvent";
import Attendee from "@/models/Attendee";
import Credential from "@/models/Credential";
import User from "@/models/User";
import {
    AccessResult,
    AccessResultValue,
    AccessType,
    AccessTypeValue,
} from "@/modules/access-event/constants";
import {
    generateAccessPublicId,
    mapCredentialReasonToResult,
    resultMessage,
} from "@/modules/access-event/helpers";
import type {
    PublicAccessEvent,
    ValidateAccessResponse,
} from "@/modules/access-event/types";
import { CredentialStatus } from "@/modules/event-credential/constants";
import { validateCredential } from "@/modules/event-credential/service";
import { EventStatus } from "@/modules/event/constants";
import { getEventForWorkspace } from "@/modules/event/service";
import {
    BadRequestError,
    NotFoundError,
} from "@/core/errors/AppError";

async function uniqueAccessPublicId(): Promise<string> {
    for (let i = 0; i < 8; i++) {
        const publicId = generateAccessPublicId();
        const exists = await AccessEvent.findOne({ publicId })
            .select("_id")
            .lean();
        if (!exists) return publicId;
    }
    return `acc_${crypto.randomBytes(8).toString("hex")}`;
}

function isEventOpen(status: string): boolean {
    return status === EventStatus.PUBLISHED;
}

async function hasSuccessfulEntry(
    eventId: mongoose.Types.ObjectId | string,
    attendeeId: mongoose.Types.ObjectId | string
): Promise<boolean> {
    const existing = await AccessEvent.findOne({
        eventId,
        attendeeId,
        type: AccessType.ENTRY,
        result: AccessResult.SUCCESS,
    })
        .select("_id")
        .lean();
    return Boolean(existing);
}

async function toPublicAccessEvent(
    doc: {
        publicId: string;
        type: AccessTypeValue;
        result: AccessResultValue;
        gate: string;
        notes?: string;
        deviceId?: string | null;
        occurredAt: Date;
        createdAt: Date;
        attendeeId?: mongoose.Types.ObjectId | null;
        credentialId?: mongoose.Types.ObjectId | null;
        checkedByUserId?: mongoose.Types.ObjectId | null;
    }
): Promise<PublicAccessEvent> {
    const [attendee, credential, operator] = await Promise.all([
        doc.attendeeId
            ? Attendee.findById(doc.attendeeId)
                  .select("publicId firstName lastName email ticketType")
                  .lean()
            : null,
        doc.credentialId
            ? Credential.findById(doc.credentialId)
                  .select("publicId tokenVersion status")
                  .lean()
            : null,
        doc.checkedByUserId
            ? User.findById(doc.checkedByUserId).select("name email").lean()
            : null,
    ]);

    return {
        id: doc.publicId,
        publicId: doc.publicId,
        type: doc.type,
        result: doc.result,
        gate: doc.gate || "Main",
        notes: doc.notes || "",
        deviceId: doc.deviceId ?? null,
        occurredAt: doc.occurredAt.toISOString(),
        createdAt: doc.createdAt.toISOString(),
        attendee: attendee
            ? {
                  id: attendee.publicId,
                  firstName: attendee.firstName,
                  lastName: attendee.lastName,
                  email: attendee.email,
                  ticketType: attendee.ticketType || "General",
              }
            : null,
        credential: credential
            ? {
                  id: credential.publicId,
                  tokenVersion: credential.tokenVersion,
                  status: credential.status,
              }
            : null,
        operator: operator
            ? {
                  name: operator.name || null,
                  email: operator.email || null,
              }
            : null,
    };
}

type RecordAccessInput = {
    workspaceId: string;
    eventId: string;
    attendeeId?: mongoose.Types.ObjectId | null;
    credentialId?: mongoose.Types.ObjectId | null;
    type: AccessTypeValue;
    result: AccessResultValue;
    gate: string;
    checkedByUserId?: string | null;
    deviceId?: string | null;
    notes?: string;
    metadata?: Record<string, unknown>;
};

async function recordAccessEvent(
    input: RecordAccessInput
): Promise<PublicAccessEvent> {
    const doc = await AccessEvent.create({
        publicId: await uniqueAccessPublicId(),
        workspaceId: input.workspaceId,
        eventId: input.eventId,
        attendeeId: input.attendeeId ?? null,
        credentialId: input.credentialId ?? null,
        type: input.type,
        result: input.result,
        gate: input.gate || "Main",
        checkedByUserId: input.checkedByUserId || null,
        deviceId: input.deviceId ?? null,
        notes: input.notes || "",
        metadata: input.metadata || {},
        occurredAt: new Date(),
    });

    return toPublicAccessEvent(doc.toObject());
}

function buildResponse(
    accessEvent: PublicAccessEvent,
    result: AccessResultValue,
    event: { name: string; slug: string; status: string } | null,
    extras?: { previousEntryAt?: string | null }
): ValidateAccessResponse {
    return {
        allowed: result === AccessResult.SUCCESS,
        result,
        message: resultMessage(result),
        accessEvent,
        attendee: accessEvent.attendee,
        credential: accessEvent.credential,
        event: event
            ? {
                  id: event.slug,
                  name: event.name,
                  slug: event.slug,
                  status: event.status,
              }
            : null,
        previousEntryAt: extras?.previousEntryAt ?? null,
    };
}

/**
 * Full access pipeline: validate credential → event checks → duplicate ENTRY → audit row.
 */
export async function validateAccess(input: {
    token: string;
    workspaceId: string;
    /** Expected event (from route). Credential must belong here. */
    eventId: string;
    userId?: string | null;
    type?: AccessTypeValue;
    gate?: string;
    deviceId?: string | null;
    notes?: string;
}): Promise<ValidateAccessResponse> {
    const response = await runValidateAccess(input);

    const { publishDomainEvent, WebhookEventType } = await import(
        "@/modules/webhooks"
    );
    void publishDomainEvent({
        workspaceId: input.workspaceId,
        type: response.allowed
            ? WebhookEventType.ACCESS_GRANTED
            : WebhookEventType.ACCESS_DENIED,
        data: {
            eventId: input.eventId,
            result: response.result,
            message: response.message,
            gate: input.gate || "Main",
            type: input.type || "ENTRY",
            accessEvent: response.accessEvent,
            attendee: response.attendee,
        },
    });

    return response;
}

async function runValidateAccess(input: {
    token: string;
    workspaceId: string;
    eventId: string;
    userId?: string | null;
    type?: AccessTypeValue;
    gate?: string;
    deviceId?: string | null;
    notes?: string;
}): Promise<ValidateAccessResponse> {
    await dbConnect();

    const event = await getEventForWorkspace(input.eventId, input.workspaceId);
    const type = input.type || AccessType.ENTRY;
    const gate = input.gate || "Main";

    const validation = await validateCredential(input.token);

    // Resolve internal docs when possible (even on failure for audit)
    const credentialDoc = await Credential.findOne({
        token: input.token,
    })
        .select("+token")
        .lean();

    let attendeeId: mongoose.Types.ObjectId | null =
        (credentialDoc?.attendeeId as mongoose.Types.ObjectId) || null;
    let credentialId: mongoose.Types.ObjectId | null =
        (credentialDoc?._id as mongoose.Types.ObjectId) || null;

    // Wrong event
    if (
        credentialDoc &&
        String(credentialDoc.eventId) !== String(input.eventId)
    ) {
        const accessEvent = await recordAccessEvent({
            workspaceId: input.workspaceId,
            eventId: input.eventId,
            attendeeId: null,
            credentialId,
            type,
            result: AccessResult.INVALID_CREDENTIAL,
            gate,
            checkedByUserId: input.userId || null,
            deviceId: input.deviceId,
            notes: input.notes,
            metadata: { reason: "CREDENTIAL_WRONG_EVENT" },
        });
        return buildResponse(accessEvent, AccessResult.INVALID_CREDENTIAL, {
            name: event.name,
            slug: event.slug,
            status: event.status,
        });
    }

    if (!validation.valid) {
        const result = mapCredentialReasonToResult(validation.reason);
        const accessEvent = await recordAccessEvent({
            workspaceId: input.workspaceId,
            eventId: input.eventId,
            attendeeId,
            credentialId,
            type,
            result,
            gate,
            checkedByUserId: input.userId || null,
            deviceId: input.deviceId,
            notes: input.notes,
            metadata: { reason: validation.reason },
        });
        return buildResponse(accessEvent, result, {
            name: event.name,
            slug: event.slug,
            status: event.status,
        });
    }

    if (!isEventOpen(event.status)) {
        const accessEvent = await recordAccessEvent({
            workspaceId: input.workspaceId,
            eventId: input.eventId,
            attendeeId,
            credentialId,
            type,
            result: AccessResult.EVENT_NOT_OPEN,
            gate,
            checkedByUserId: input.userId || null,
            deviceId: input.deviceId,
            notes: input.notes,
        });
        return buildResponse(accessEvent, AccessResult.EVENT_NOT_OPEN, {
            name: event.name,
            slug: event.slug,
            status: event.status,
        });
    }

    if (type === AccessType.ENTRY && attendeeId) {
        if (await hasSuccessfulEntry(input.eventId, attendeeId)) {
            const prior = await AccessEvent.findOne({
                eventId: input.eventId,
                attendeeId,
                type: AccessType.ENTRY,
                result: AccessResult.SUCCESS,
            })
                .select("occurredAt")
                .sort({ occurredAt: 1 })
                .lean();
            const accessEvent = await recordAccessEvent({
                workspaceId: input.workspaceId,
                eventId: input.eventId,
                attendeeId,
                credentialId,
                type,
                result: AccessResult.ALREADY_ENTERED,
                gate,
                checkedByUserId: input.userId || null,
                deviceId: input.deviceId,
                notes: input.notes,
            });
            return buildResponse(
                accessEvent,
                AccessResult.ALREADY_ENTERED,
                {
                    name: event.name,
                    slug: event.slug,
                    status: event.status,
                },
                {
                    previousEntryAt: prior?.occurredAt
                        ? new Date(prior.occurredAt).toISOString()
                        : null,
                }
            );
        }
    }

    const accessEvent = await recordAccessEvent({
        workspaceId: input.workspaceId,
        eventId: input.eventId,
        attendeeId,
        credentialId,
        type,
        result: AccessResult.SUCCESS,
        gate,
        checkedByUserId: input.userId || null,
        deviceId: input.deviceId,
        notes: input.notes,
    });

    return buildResponse(accessEvent, AccessResult.SUCCESS, {
        name: event.name,
        slug: event.slug,
        status: event.status,
    });
}

async function manualAccess(input: {
    workspaceId: string;
    eventId: string;
    attendeePublicId: string;
    userId: string;
    type: AccessTypeValue;
    gate?: string;
    notes?: string;
    deviceId?: string | null;
}): Promise<ValidateAccessResponse> {
    await dbConnect();
    const event = await getEventForWorkspace(input.eventId, input.workspaceId);

    const attendee = await Attendee.findOne({
        workspaceId: input.workspaceId,
        eventId: input.eventId,
        publicId: input.attendeePublicId,
    });
    if (!attendee) throw new NotFoundError("Attendee not found");

    const credential = await Credential.findOne({
        workspaceId: input.workspaceId,
        eventId: input.eventId,
        attendeeId: attendee._id,
        status: CredentialStatus.ACTIVE,
    });

    const gate = input.gate || "Manual";
    const attendeeId = attendee._id as mongoose.Types.ObjectId;
    const credentialId = (credential?._id as mongoose.Types.ObjectId) || null;

    if (!credential) {
        const accessEvent = await recordAccessEvent({
            workspaceId: input.workspaceId,
            eventId: input.eventId,
            attendeeId,
            credentialId: null,
            type: input.type,
            result: AccessResult.INVALID_CREDENTIAL,
            gate,
            checkedByUserId: input.userId || null,
            deviceId: input.deviceId,
            notes: input.notes,
            metadata: { reason: "NO_ACTIVE_CREDENTIAL", manual: true },
        });
        return buildResponse(accessEvent, AccessResult.INVALID_CREDENTIAL, {
            name: event.name,
            slug: event.slug,
            status: event.status,
        });
    }

    // Reuse token pipeline for credential status / expiry
    const withToken = await Credential.findById(credential._id).select("+token");
    if (!withToken?.token) {
        throw new BadRequestError("Credential token unavailable");
    }

    return validateAccess({
        token: withToken.token,
        workspaceId: input.workspaceId,
        eventId: input.eventId,
        userId: input.userId,
        type: input.type,
        gate,
        deviceId: input.deviceId,
        notes: input.notes,
    });
}

export async function createManualEntry(input: {
    workspaceId: string;
    eventId: string;
    attendeePublicId: string;
    userId: string;
    gate?: string;
    notes?: string;
    deviceId?: string | null;
}) {
    return manualAccess({ ...input, type: AccessType.ENTRY });
}

export async function createManualExit(input: {
    workspaceId: string;
    eventId: string;
    attendeePublicId: string;
    userId: string;
    gate?: string;
    notes?: string;
    deviceId?: string | null;
}) {
    return manualAccess({ ...input, type: AccessType.EXIT });
}

export async function listAccessEvents(
    workspaceId: string,
    eventId: string,
    query: {
        q?: string;
        gate?: string;
        result?: AccessResultValue;
        type?: AccessTypeValue;
        attendeePublicId?: string;
        page: number;
        limit: number;
    }
) {
    await dbConnect();
    await getEventForWorkspace(eventId, workspaceId);

    const filter: Record<string, unknown> = { workspaceId, eventId };
    if (query.result) filter.result = query.result;
    if (query.type) filter.type = query.type;
    if (query.gate) filter.gate = query.gate;

    if (query.attendeePublicId) {
        const attendee = await Attendee.findOne({
            workspaceId,
            eventId,
            publicId: query.attendeePublicId,
        })
            .select("_id")
            .lean();
        if (!attendee) {
            return {
                items: [] as PublicAccessEvent[],
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total: 0,
                    totalPages: 1,
                },
            };
        }
        filter.attendeeId = attendee._id;
    }

    if (query.q) {
        const attendees = await Attendee.find({
            workspaceId,
            eventId,
            $or: [
                { firstName: { $regex: query.q, $options: "i" } },
                { lastName: { $regex: query.q, $options: "i" } },
                { email: { $regex: query.q, $options: "i" } },
            ],
        })
            .select("_id")
            .lean();
        const ids = attendees.map((a) => a._id);
        filter.attendeeId = { $in: ids };
    }

    const skip = (query.page - 1) * query.limit;
    const [total, rows] = await Promise.all([
        AccessEvent.countDocuments(filter),
        AccessEvent.find(filter)
            .sort({ occurredAt: -1 })
            .skip(skip)
            .limit(query.limit)
            .lean(),
    ]);

    const items = await Promise.all(rows.map((r) => toPublicAccessEvent(r)));

    return {
        items,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / query.limit)),
        },
    };
}

export async function getAccessTimeline(
    workspaceId: string,
    eventId: string,
    attendeePublicId: string
) {
    await dbConnect();
    await getEventForWorkspace(eventId, workspaceId);

    const attendee = await Attendee.findOne({
        workspaceId,
        eventId,
        publicId: attendeePublicId,
    })
        .select("_id")
        .lean();
    if (!attendee) throw new NotFoundError("Attendee not found");

    const rows = await AccessEvent.find({
        workspaceId,
        eventId,
        attendeeId: attendee._id,
    })
        .sort({ occurredAt: -1 })
        .limit(100)
        .lean();

    return Promise.all(rows.map((r) => toPublicAccessEvent(r)));
}
