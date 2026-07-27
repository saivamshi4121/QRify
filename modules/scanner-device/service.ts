import crypto from "crypto";
import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import Event from "@/models/Event";
import ScannerDevice from "@/models/ScannerDevice";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
} from "@/core/errors/AppError";
import { EventStatus } from "@/modules/event/constants";
import { getEventForWorkspace } from "@/modules/event/service";
import {
    PAIRING_TTL_MS,
    ScannerDeviceStatus,
} from "@/modules/scanner-device/constants";
import {
    buildPairingQrPayload,
    computeDisplayStatus,
    generatePairingCode,
    generateScannerPublicId,
    hashPairingCode,
} from "@/modules/scanner-device/helpers";
import { signScannerToken } from "@/modules/scanner-device/token";
import type {
    PairingCreateResult,
    PublicScannerDevice,
    ScannerSessionResponse,
} from "@/modules/scanner-device/types";

async function uniquePublicId(): Promise<string> {
    for (let i = 0; i < 8; i++) {
        const publicId = generateScannerPublicId();
        const exists = await ScannerDevice.findOne({ publicId })
            .select("_id")
            .lean();
        if (!exists) return publicId;
    }
    return `scd_${crypto.randomBytes(8).toString("hex")}`;
}

async function toPublicDevice(
    doc: {
        publicId: string;
        name: string;
        gate: string;
        status: string;
        pairedAt?: Date | null;
        lastSeen?: Date | null;
        lastScanAt?: Date | null;
        appVersion?: string | null;
        pairedBy?: mongoose.Types.ObjectId | null;
        pairingExpiresAt?: Date | null;
    },
    opts?: { includePairingExpiry?: boolean }
): Promise<PublicScannerDevice> {
    const operator = doc.pairedBy
        ? await User.findById(doc.pairedBy).select("name email").lean()
        : null;

    const status = computeDisplayStatus(
        doc.status as PublicScannerDevice["status"],
        doc.lastSeen
    );

    return {
        id: doc.publicId,
        publicId: doc.publicId,
        name: doc.name,
        gate: doc.gate || "",
        status,
        pairedAt: doc.pairedAt ? doc.pairedAt.toISOString() : null,
        lastSeen: doc.lastSeen ? doc.lastSeen.toISOString() : null,
        lastScanAt: doc.lastScanAt ? doc.lastScanAt.toISOString() : null,
        appVersion: doc.appVersion || null,
        operator: operator
            ? {
                  name: operator.name || null,
                  email: operator.email || null,
              }
            : null,
        ...(opts?.includePairingExpiry
            ? {
                  pairingExpiresAt: doc.pairingExpiresAt
                      ? doc.pairingExpiresAt.toISOString()
                      : null,
              }
            : {}),
    };
}

function assertEventScannable(status: string) {
    if (
        status === EventStatus.ARCHIVED ||
        status === EventStatus.COMPLETED
    ) {
        throw new ForbiddenError(
            "This scanner is no longer paired. The event is not available."
        );
    }
}

/**
 * Dashboard: create a pending pairing for an event.
 */
export async function createPairing(input: {
    workspaceId: string;
    eventId: string;
    userId: string;
    name?: string;
    gate?: string;
}): Promise<PairingCreateResult> {
    await dbConnect();
    const event = await getEventForWorkspace(input.eventId, input.workspaceId);
    assertEventScannable(event.status);

    const pairingCode = generatePairingCode();
    const pairingCodeHash = hashPairingCode(pairingCode);
    const pairingExpiresAt = new Date(Date.now() + PAIRING_TTL_MS);

    const doc = await ScannerDevice.create({
        publicId: await uniquePublicId(),
        workspaceId: input.workspaceId,
        eventId: input.eventId,
        name: input.name || "Scanner",
        gate: input.gate || "",
        status: ScannerDeviceStatus.PAIRING,
        pairingCodeHash,
        pairingExpiresAt,
        pairedBy: input.userId,
    });

    const device = await toPublicDevice(doc.toObject(), {
        includePairingExpiry: true,
    });

    return {
        device,
        pairingCode,
        pairingQr: buildPairingQrPayload(pairingCode),
        expiresAt: pairingExpiresAt.toISOString(),
    };
}

export async function listScannerDevices(
    workspaceId: string,
    eventId: string
): Promise<PublicScannerDevice[]> {
    await dbConnect();
    await getEventForWorkspace(eventId, workspaceId);
    const docs = await ScannerDevice.find({
        workspaceId,
        eventId,
        status: { $ne: ScannerDeviceStatus.PAIRING },
    })
        .sort({ pairedAt: -1, createdAt: -1 })
        .lean();

    // Also include active PAIRING rows so organizers see pending codes
    const pending = await ScannerDevice.find({
        workspaceId,
        eventId,
        status: ScannerDeviceStatus.PAIRING,
        pairingExpiresAt: { $gt: new Date() },
    })
        .sort({ createdAt: -1 })
        .lean();

    const all = [...pending, ...docs];
    return Promise.all(
        all.map((d) =>
            toPublicDevice(d, {
                includePairingExpiry: d.status === ScannerDeviceStatus.PAIRING,
            })
        )
    );
}

export async function renameScannerDevice(input: {
    workspaceId: string;
    eventId: string;
    devicePublicId: string;
    name: string;
}): Promise<PublicScannerDevice> {
    await dbConnect();
    await getEventForWorkspace(input.eventId, input.workspaceId);
    const doc = await ScannerDevice.findOne({
        publicId: input.devicePublicId,
        workspaceId: input.workspaceId,
        eventId: input.eventId,
    });
    if (!doc) throw new NotFoundError("Scanner device not found");
    doc.name = input.name;
    await doc.save();
    return toPublicDevice(doc.toObject());
}

export async function updateScannerDeviceGate(input: {
    workspaceId: string;
    eventId: string;
    devicePublicId: string;
    gate: string;
}): Promise<PublicScannerDevice> {
    await dbConnect();
    await getEventForWorkspace(input.eventId, input.workspaceId);
    const doc = await ScannerDevice.findOne({
        publicId: input.devicePublicId,
        workspaceId: input.workspaceId,
        eventId: input.eventId,
    });
    if (!doc) throw new NotFoundError("Scanner device not found");
    doc.gate = input.gate;
    await doc.save();
    return toPublicDevice(doc.toObject());
}

export async function revokeScannerDevice(input: {
    workspaceId: string;
    eventId: string;
    devicePublicId: string;
}): Promise<PublicScannerDevice> {
    await dbConnect();
    await getEventForWorkspace(input.eventId, input.workspaceId);
    const doc = await ScannerDevice.findOne({
        publicId: input.devicePublicId,
        workspaceId: input.workspaceId,
        eventId: input.eventId,
    });
    if (!doc) throw new NotFoundError("Scanner device not found");
    doc.status = ScannerDeviceStatus.DISABLED;
    doc.pairingCodeHash = null;
    doc.pairingExpiresAt = null;
    await doc.save();

    const publicDevice = toPublicDevice(doc.toObject());

    const { publishDomainEvent, WebhookEventType } = await import(
        "@/modules/webhooks"
    );
    void publishDomainEvent({
        workspaceId: input.workspaceId,
        type: WebhookEventType.SCANNER_UNPAIRED,
        data: {
            deviceId: doc.publicId,
            eventId: input.eventId,
            name: doc.name,
            via: "organizer",
        },
    });

    return publicDevice;
}

async function buildSessionResponse(
    device: {
        publicId: string;
        name: string;
        gate: string;
        status: string;
        pairedAt?: Date | null;
        lastSeen?: Date | null;
        lastScanAt?: Date | null;
        appVersion?: string | null;
        pairedBy?: mongoose.Types.ObjectId | null;
        workspaceId: mongoose.Types.ObjectId | string;
        eventId: mongoose.Types.ObjectId | string;
    },
    gate: string
): Promise<ScannerSessionResponse> {
    const [workspace, event] = await Promise.all([
        Workspace.findById(device.workspaceId).select("name").lean(),
        Event.findById(device.eventId).select("name status").lean(),
    ]);

    if (!workspace || !event) {
        throw new NotFoundError("Workspace or event not found");
    }
    assertEventScannable(event.status);

    const publicDevice = await toPublicDevice({
        ...device,
        gate,
    });

    const token = signScannerToken({
        deviceId: device.publicId,
        workspaceId: String(device.workspaceId),
        eventId: String(device.eventId),
        gate,
    });

    return {
        token,
        device: publicDevice,
        workspace: {
            id: String(device.workspaceId),
            name: workspace.name,
        },
        event: {
            id: String(device.eventId),
            name: event.name,
            status: event.status,
        },
        gate,
    };
}

/**
 * Scanner: redeem a pairing code for a session token.
 */
export async function pairWithCode(input: {
    pairingCode: string;
    deviceFingerprint?: string | null;
    appVersion?: string | null;
    deviceName?: string | null;
}): Promise<ScannerSessionResponse> {
    await dbConnect();
    const codeHash = hashPairingCode(input.pairingCode);

    const doc = await ScannerDevice.findOne({
        pairingCodeHash: codeHash,
        status: ScannerDeviceStatus.PAIRING,
    }).select("+pairingCodeHash");

    if (!doc) {
        throw new BadRequestError("Invalid or expired pairing code");
    }

    if (
        !doc.pairingExpiresAt ||
        doc.pairingExpiresAt.getTime() < Date.now()
    ) {
        doc.status = ScannerDeviceStatus.DISABLED;
        doc.pairingCodeHash = null;
        doc.pairingExpiresAt = null;
        await doc.save();
        throw new BadRequestError("Pairing code has expired");
    }

    const event = await Event.findById(doc.eventId).lean();
    if (!event) throw new NotFoundError("Event not found");
    assertEventScannable(event.status);

    // Invalidate code immediately (single use)
    doc.pairingCodeHash = null;
    doc.pairingExpiresAt = null;
    doc.status = ScannerDeviceStatus.ONLINE;
    doc.pairedAt = new Date();
    doc.lastSeen = new Date();
    if (input.deviceFingerprint) {
        doc.deviceFingerprint = input.deviceFingerprint;
    }
    if (input.appVersion) doc.appVersion = input.appVersion;
    if (input.deviceName?.trim()) doc.name = input.deviceName.trim();
    await doc.save();

    const { publishDomainEvent, WebhookEventType } = await import(
        "@/modules/webhooks"
    );
    void publishDomainEvent({
        workspaceId: String(doc.workspaceId),
        type: WebhookEventType.SCANNER_PAIRED,
        data: {
            deviceId: doc.publicId,
            eventId: String(doc.eventId),
            name: doc.name,
            gate: doc.gate,
            via: "pairing_code",
        },
    });

    return buildSessionResponse(doc.toObject(), doc.gate || "");
}

/**
 * Staff login path: create an immediately-paired device session.
 */
export async function createStaffSession(input: {
    workspaceId: string;
    userId: string;
    eventId: string;
    gate: string;
    deviceName?: string;
    deviceFingerprint?: string | null;
    appVersion?: string | null;
}): Promise<ScannerSessionResponse> {
    await dbConnect();
    const event = await getEventForWorkspace(input.eventId, input.workspaceId);
    assertEventScannable(event.status);

    const user = await User.findById(input.userId).select("name email").lean();
    const label =
        input.deviceName?.trim() ||
        (user?.name ? `Staff — ${user.name}` : "Staff scanner");

    const doc = await ScannerDevice.create({
        publicId: await uniquePublicId(),
        workspaceId: input.workspaceId,
        eventId: input.eventId,
        name: label,
        gate: input.gate,
        status: ScannerDeviceStatus.ONLINE,
        pairingCodeHash: null,
        pairingExpiresAt: null,
        pairedAt: new Date(),
        pairedBy: input.userId,
        deviceFingerprint: input.deviceFingerprint || null,
        lastSeen: new Date(),
        appVersion: input.appVersion || null,
    });

    const { publishDomainEvent, WebhookEventType } = await import(
        "@/modules/webhooks"
    );
    void publishDomainEvent({
        workspaceId: input.workspaceId,
        type: WebhookEventType.SCANNER_PAIRED,
        data: {
            deviceId: doc.publicId,
            eventId: input.eventId,
            name: doc.name,
            gate: doc.gate,
            via: "staff",
        },
    });

    return buildSessionResponse(doc.toObject(), input.gate);
}

export async function getSessionForDevice(
    devicePublicId: string
): Promise<ScannerSessionResponse> {
    await dbConnect();
    const doc = await ScannerDevice.findOne({ publicId: devicePublicId });
    if (!doc) throw new NotFoundError("Scanner device not found");
    if (doc.status === ScannerDeviceStatus.DISABLED) {
        throw new ForbiddenError("This scanner is no longer paired.");
    }
    if (doc.status === ScannerDeviceStatus.PAIRING) {
        throw new UnauthorizedError("Device is not paired yet");
    }

    const event = await Event.findById(doc.eventId).lean();
    if (!event) {
        throw new ForbiddenError("This scanner is no longer paired.");
    }
    assertEventScannable(event.status);

    doc.lastSeen = new Date();
    doc.status = ScannerDeviceStatus.ONLINE;
    await doc.save();

    return buildSessionResponse(doc.toObject(), doc.gate || "");
}

export async function heartbeatDevice(input: {
    devicePublicId: string;
    appVersion?: string | null;
}): Promise<PublicScannerDevice> {
    await dbConnect();
    const doc = await ScannerDevice.findOne({
        publicId: input.devicePublicId,
    });
    if (!doc) throw new NotFoundError("Scanner device not found");
    if (doc.status === ScannerDeviceStatus.DISABLED) {
        throw new ForbiddenError("This scanner is no longer paired.");
    }

    const event = await Event.findById(doc.eventId).select("status").lean();
    if (!event || event.status === EventStatus.ARCHIVED) {
        throw new ForbiddenError("This scanner is no longer paired.");
    }

    doc.lastSeen = new Date();
    doc.status = ScannerDeviceStatus.ONLINE;
    if (input.appVersion) doc.appVersion = input.appVersion;
    await doc.save();
    return toPublicDevice(doc.toObject());
}

export async function setDeviceGateFromScanner(input: {
    devicePublicId: string;
    gate: string;
}): Promise<ScannerSessionResponse> {
    await dbConnect();
    const doc = await ScannerDevice.findOne({
        publicId: input.devicePublicId,
    });
    if (!doc) throw new NotFoundError("Scanner device not found");
    if (doc.status === ScannerDeviceStatus.DISABLED) {
        throw new ForbiddenError("This scanner is no longer paired.");
    }

    doc.gate = input.gate;
    doc.lastSeen = new Date();
    doc.status = ScannerDeviceStatus.ONLINE;
    await doc.save();

    return buildSessionResponse(doc.toObject(), input.gate);
}

export async function unpairDevice(
    devicePublicId: string
): Promise<{ ok: true }> {
    await dbConnect();
    const doc = await ScannerDevice.findOne({ publicId: devicePublicId });
    if (!doc) throw new NotFoundError("Scanner device not found");
    doc.status = ScannerDeviceStatus.DISABLED;
    doc.pairingCodeHash = null;
    doc.pairingExpiresAt = null;
    await doc.save();

    const { publishDomainEvent, WebhookEventType } = await import(
        "@/modules/webhooks"
    );
    void publishDomainEvent({
        workspaceId: String(doc.workspaceId),
        type: WebhookEventType.SCANNER_UNPAIRED,
        data: {
            deviceId: doc.publicId,
            eventId: String(doc.eventId),
            name: doc.name,
            via: "device",
        },
    });

    return { ok: true };
}

export async function markDeviceScan(devicePublicId: string) {
    await ScannerDevice.updateOne(
        { publicId: devicePublicId },
        {
            $set: {
                lastScanAt: new Date(),
                lastSeen: new Date(),
                status: ScannerDeviceStatus.ONLINE,
            },
        }
    );
}

export async function requireActiveDevice(devicePublicId: string) {
    await dbConnect();
    const doc = await ScannerDevice.findOne({ publicId: devicePublicId });
    if (!doc || doc.status === ScannerDeviceStatus.DISABLED) {
        throw new ForbiddenError("This scanner is no longer paired.");
    }
    const event = await Event.findById(doc.eventId).select("status").lean();
    if (
        !event ||
        event.status === EventStatus.ARCHIVED ||
        event.status === EventStatus.COMPLETED
    ) {
        throw new ForbiddenError("This scanner is no longer paired.");
    }
    return doc;
}
