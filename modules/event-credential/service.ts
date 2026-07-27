import crypto from "crypto";
import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import Credential from "@/models/Credential";
import Attendee from "@/models/Attendee";
import Event from "@/models/Event";
import {
    CredentialStatus,
    CredentialStatusValue,
} from "@/modules/event-credential/constants";
import {
    buildQrPayload,
    generateCredentialPublicId,
    generateCredentialToken,
} from "@/modules/event-credential/helpers";
import {
    renderCredentialPng,
    renderCredentialSvg,
} from "@/modules/event-credential/renderer";
import type {
    PublicCredential,
    ValidateCredentialResult,
} from "@/modules/event-credential/types";
import { getEventForWorkspace } from "@/modules/event/service";
import {
    BadRequestError,
    NotFoundError,
} from "@/core/errors/AppError";

async function uniqueCredentialPublicId(): Promise<string> {
    for (let i = 0; i < 8; i++) {
        const publicId = generateCredentialPublicId();
        const exists = await Credential.findOne({ publicId }).select("_id").lean();
        if (!exists) return publicId;
    }
    return `cred_${crypto.randomBytes(8).toString("hex")}`;
}

function toPublicCredential(
    doc: {
        publicId: string;
        status: CredentialStatusValue;
        tokenVersion: number;
        generatedAt: Date;
        expiresAt?: Date | null;
        revokedAt?: Date | null;
        revokedReason?: string | null;
        lastDownloadedAt?: Date | null;
        createdAt: Date;
        updatedAt: Date;
        token?: string;
    },
    options?: { includeToken?: boolean }
): PublicCredential {
    return {
        id: doc.publicId,
        publicId: doc.publicId,
        status: doc.status,
        tokenVersion: doc.tokenVersion,
        generatedAt: doc.generatedAt.toISOString(),
        expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
        revokedAt: doc.revokedAt ? doc.revokedAt.toISOString() : null,
        revokedReason: doc.revokedReason ?? null,
        lastDownloadedAt: doc.lastDownloadedAt
            ? doc.lastDownloadedAt.toISOString()
            : null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        ...(options?.includeToken && doc.token
            ? { token: String(doc.token) }
            : {}),
    };
}

async function resolveAttendeeDoc(
    workspaceId: string,
    eventId: string,
    attendeePublicId: string
) {
    await getEventForWorkspace(eventId, workspaceId);
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new BadRequestError("Invalid event");
    }
    const attendee = await Attendee.findOne({
        workspaceId,
        eventId,
        publicId: attendeePublicId,
    });
    if (!attendee) throw new NotFoundError("Attendee not found");
    return attendee;
}

function isExpired(expiresAt?: Date | null): boolean {
    return Boolean(expiresAt && expiresAt.getTime() < Date.now());
}

async function markExpiredIfNeeded(credential: InstanceType<typeof Credential>) {
    if (
        credential.status === CredentialStatus.ACTIVE &&
        isExpired(credential.expiresAt)
    ) {
        credential.status = CredentialStatus.EXPIRED;
        await credential.save();
    }
    return credential;
}

async function revokeActiveForAttendee(
    attendeeId: mongoose.Types.ObjectId,
    reason: string
) {
    await Credential.updateMany(
        { attendeeId, status: CredentialStatus.ACTIVE },
        {
            $set: {
                status: CredentialStatus.REVOKED,
                revokedAt: new Date(),
                revokedReason: reason,
            },
        }
    );
}

export async function getCredential(
    workspaceId: string,
    eventId: string,
    attendeePublicId: string
): Promise<PublicCredential | null> {
    await dbConnect();
    const attendee = await resolveAttendeeDoc(
        workspaceId,
        eventId,
        attendeePublicId
    );

    // Prefer active; else latest credential for display
    let credential = await Credential.findOne({
        workspaceId,
        eventId,
        attendeeId: attendee._id,
        status: CredentialStatus.ACTIVE,
    }).sort({ tokenVersion: -1 });

    if (!credential) {
        credential = await Credential.findOne({
            workspaceId,
            eventId,
            attendeeId: attendee._id,
        }).sort({ tokenVersion: -1 });
    }

    if (!credential) return null;
    await markExpiredIfNeeded(credential);
    return toPublicCredential(credential);
}

export async function createCredential(
    workspaceId: string,
    eventId: string,
    attendeePublicId: string,
    options?: {
        expiresAt?: Date | null;
        /** Which webhook to emit; default credential.generated */
        webhookEvent?: "credential.generated" | "credential.regenerated" | null;
    }
): Promise<PublicCredential> {
    await dbConnect();
    const attendee = await resolveAttendeeDoc(
        workspaceId,
        eventId,
        attendeePublicId
    );

    const latest = await Credential.findOne({
        attendeeId: attendee._id,
    })
        .sort({ tokenVersion: -1 })
        .select("tokenVersion")
        .lean();

    const nextVersion = (latest?.tokenVersion ?? 0) + 1;

    await revokeActiveForAttendee(
        attendee._id as mongoose.Types.ObjectId,
        "Superseded by new credential"
    );

    const doc = await Credential.create({
        publicId: await uniqueCredentialPublicId(),
        workspaceId,
        eventId,
        attendeeId: attendee._id,
        token: generateCredentialToken(),
        tokenVersion: nextVersion,
        status: CredentialStatus.ACTIVE,
        generatedAt: new Date(),
        expiresAt: options?.expiresAt ?? null,
    });

    const publicCred = toPublicCredential(doc.toObject(), {
        includeToken: true,
    });

    if (options?.webhookEvent !== null) {
        const { publishDomainEvent, WebhookEventType } = await import(
            "@/modules/webhooks"
        );
        const type =
            options?.webhookEvent === "credential.regenerated"
                ? WebhookEventType.CREDENTIAL_REGENERATED
                : WebhookEventType.CREDENTIAL_GENERATED;
        void publishDomainEvent({
            workspaceId,
            type,
            data: {
                eventId,
                attendeeId: attendeePublicId,
                ...publicCred,
            },
        });
    }

    return publicCred;
}

export async function regenerateCredential(
    workspaceId: string,
    eventId: string,
    attendeePublicId: string
): Promise<PublicCredential> {
    return createCredential(workspaceId, eventId, attendeePublicId, {
        webhookEvent: "credential.regenerated",
    });
}

export async function revokeCredential(
    workspaceId: string,
    eventId: string,
    attendeePublicId: string,
    reason?: string
): Promise<PublicCredential> {
    await dbConnect();
    const attendee = await resolveAttendeeDoc(
        workspaceId,
        eventId,
        attendeePublicId
    );

    const credential = await Credential.findOne({
        workspaceId,
        eventId,
        attendeeId: attendee._id,
        status: CredentialStatus.ACTIVE,
    });

    if (!credential) {
        throw new NotFoundError("No active credential to revoke");
    }

    credential.status = CredentialStatus.REVOKED;
    credential.revokedAt = new Date();
    credential.revokedReason = reason || "Revoked by organizer";
    await credential.save();

    const publicCred = toPublicCredential(credential);

    const { publishDomainEvent, WebhookEventType } = await import(
        "@/modules/webhooks"
    );
    void publishDomainEvent({
        workspaceId,
        type: WebhookEventType.CREDENTIAL_REVOKED,
        data: {
            eventId,
            attendeeId: attendeePublicId,
            reason: publicCred.revokedReason,
            ...publicCred,
        },
    });

    return publicCred;
}

export async function restoreCredential(
    workspaceId: string,
    eventId: string,
    attendeePublicId: string
): Promise<PublicCredential> {
    await dbConnect();
    const attendee = await resolveAttendeeDoc(
        workspaceId,
        eventId,
        attendeePublicId
    );

    const revoked = await Credential.findOne({
        workspaceId,
        eventId,
        attendeeId: attendee._id,
        status: CredentialStatus.REVOKED,
    }).sort({ tokenVersion: -1 });

    if (!revoked) {
        throw new NotFoundError("No revoked credential to restore");
    }

    if (isExpired(revoked.expiresAt)) {
        throw new BadRequestError("Cannot restore an expired credential");
    }

    await revokeActiveForAttendee(
        attendee._id as mongoose.Types.ObjectId,
        "Superseded by restore"
    );

    revoked.status = CredentialStatus.ACTIVE;
    revoked.revokedAt = null;
    revoked.revokedReason = null;
    revoked.restoreCount = (revoked.restoreCount || 0) + 1;
    await revoked.save();

    return toPublicCredential(revoked);
}

/**
 * Reusable validation for Scanner / SDK later.
 * Looks up by opaque token only.
 */
export async function validateCredential(
    token: string
): Promise<ValidateCredentialResult> {
    await dbConnect();

    const credential = await Credential.findOne({ token }).select("+token");
    if (!credential) {
        return {
            valid: false,
            reason: "CREDENTIAL_NOT_FOUND",
            credential: null,
            attendee: null,
            event: null,
        };
    }

    await markExpiredIfNeeded(credential);

    const attendee = await Attendee.findById(credential.attendeeId).lean();
    const event = await Event.findById(credential.eventId).lean();

    const publicCred = toPublicCredential(credential);
    const publicAttendee = attendee
        ? {
              id: attendee.publicId,
              publicId: attendee.publicId,
              firstName: attendee.firstName,
              lastName: attendee.lastName,
              email: attendee.email,
              ticketType: attendee.ticketType,
              registrationStatus: attendee.registrationStatus,
          }
        : null;
    const publicEvent = event
        ? {
              id: String(event._id), // event routes still use mongo id internally for organizers
              name: event.name,
              slug: event.slug,
              status: event.status,
              startDate: event.startDate.toISOString(),
              endDate: event.endDate.toISOString(),
              timezone: event.timezone,
              venue: event.venue || "",
          }
        : null;

    // Prefer slug for public validate response — avoid mongo id externally
    const eventOut = publicEvent
        ? { ...publicEvent, id: event!.slug }
        : null;

    if (credential.status === CredentialStatus.REVOKED) {
        return {
            valid: false,
            reason: "CREDENTIAL_REVOKED",
            credential: publicCred,
            attendee: publicAttendee,
            event: eventOut,
        };
    }

    if (credential.status === CredentialStatus.EXPIRED || isExpired(credential.expiresAt)) {
        return {
            valid: false,
            reason: "CREDENTIAL_EXPIRED",
            credential: publicCred,
            attendee: publicAttendee,
            event: eventOut,
        };
    }

    if (credential.status !== CredentialStatus.ACTIVE) {
        return {
            valid: false,
            reason: "CREDENTIAL_INACTIVE",
            credential: publicCred,
            attendee: publicAttendee,
            event: eventOut,
        };
    }

    if (attendee?.registrationStatus === "CANCELLED") {
        return {
            valid: false,
            reason: "ATTENDEE_CANCELLED",
            credential: publicCred,
            attendee: publicAttendee,
            event: eventOut,
        };
    }

    return {
        valid: true,
        reason: null,
        credential: publicCred,
        attendee: publicAttendee,
        event: eventOut,
    };
}

async function loadCredentialWithToken(
    workspaceId: string,
    eventId: string,
    attendeePublicId: string
) {
    const attendee = await resolveAttendeeDoc(
        workspaceId,
        eventId,
        attendeePublicId
    );

    const credential = await Credential.findOne({
        workspaceId,
        eventId,
        attendeeId: attendee._id,
        status: CredentialStatus.ACTIVE,
    }).select("+token");

    if (!credential) {
        throw new NotFoundError("No active credential to download");
    }

    await markExpiredIfNeeded(credential);
    if (credential.status !== CredentialStatus.ACTIVE) {
        throw new BadRequestError("Credential is not active");
    }

    return credential;
}

export async function downloadPNG(
    workspaceId: string,
    eventId: string,
    attendeePublicId: string
): Promise<{ buffer: Buffer; filename: string }> {
    await dbConnect();
    const credential = await loadCredentialWithToken(
        workspaceId,
        eventId,
        attendeePublicId
    );
    const content = buildQrPayload(credential.token);
    const buffer = await renderCredentialPng(content);
    credential.lastDownloadedAt = new Date();
    credential.pngDownloadCount = (credential.pngDownloadCount || 0) + 1;
    await credential.save();
    return {
        buffer,
        filename: `${credential.publicId}.png`,
    };
}

export async function downloadSVG(
    workspaceId: string,
    eventId: string,
    attendeePublicId: string
): Promise<{ svg: string; filename: string }> {
    await dbConnect();
    const credential = await loadCredentialWithToken(
        workspaceId,
        eventId,
        attendeePublicId
    );
    const content = buildQrPayload(credential.token);
    const svg = await renderCredentialSvg(content);
    credential.lastDownloadedAt = new Date();
    credential.svgDownloadCount = (credential.svgDownloadCount || 0) + 1;
    await credential.save();
    return {
        svg,
        filename: `${credential.publicId}.svg`,
    };
}

/** Authenticated preview — does not bump lastDownloadedAt. */
export async function previewPNG(
    workspaceId: string,
    eventId: string,
    attendeePublicId: string
): Promise<Buffer> {
    await dbConnect();
    const credential = await loadCredentialWithToken(
        workspaceId,
        eventId,
        attendeePublicId
    );
    const content = buildQrPayload(credential.token);
    return renderCredentialPng(content);
}
