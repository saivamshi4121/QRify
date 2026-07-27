import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import AccessEvent from "@/models/AccessEvent";
import Attendee from "@/models/Attendee";
import Credential from "@/models/Credential";
import ScannerDevice from "@/models/ScannerDevice";
import { AccessResult, AccessType } from "@/modules/access-event/constants";
import { RegistrationStatus } from "@/modules/attendee/constants";
import { CredentialStatus } from "@/modules/event-credential/constants";
import { getEventForWorkspace } from "@/modules/event/service";
import {
    computeDisplayStatus,
} from "@/modules/scanner-device/helpers";
import {
    ONLINE_THRESHOLD_MS,
    ScannerDeviceStatus,
} from "@/modules/scanner-device/constants";
import {
    ACTIVITY_PAGE_SIZE,
    EVENT_ANALYTICS_CACHE_TTL_MS,
    SEARCH_PAGE_SIZE,
} from "@/modules/event-analytics/constants";
import type {
    AccessAnalytics,
    ActivityItem,
    AttendanceAnalytics,
    CredentialAnalytics,
    EventAnalyticsOverview,
    GatePerformanceRow,
    ScannerDeviceAnalytics,
    SearchHit,
} from "@/modules/event-analytics/types";
import { BadRequestError } from "@/core/errors/AppError";

type CacheEntry = { expiresAt: number; value: EventAnalyticsOverview };

const overviewCache = new Map<string, CacheEntry>();

function cacheKey(workspaceId: string, eventId: string) {
    return `${workspaceId}:${eventId}`;
}

function asObjectId(eventId: string) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new BadRequestError("Invalid event ID");
    }
    return new mongoose.Types.ObjectId(eventId);
}

async function checkedInAttendeeIds(
    eventId: mongoose.Types.ObjectId
): Promise<Set<string>> {
    const rows = await AccessEvent.aggregate<{ _id: mongoose.Types.ObjectId }>([
        {
            $match: {
                eventId,
                type: AccessType.ENTRY,
                result: AccessResult.SUCCESS,
                attendeeId: { $ne: null },
            },
        },
        { $group: { _id: "$attendeeId" } },
    ]);
    return new Set(rows.map((r) => String(r._id)));
}

export async function getEventAnalyticsOverview(
    workspaceId: string,
    eventId: string
): Promise<EventAnalyticsOverview> {
    const key = cacheKey(workspaceId, eventId);
    const hit = overviewCache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
        return hit.value;
    }

    await dbConnect();
    const event = await getEventForWorkspace(eventId, workspaceId);
    const eid = asObjectId(eventId);
    const wid = new mongoose.Types.ObjectId(workspaceId);

    const [
        totalAttendees,
        registeredAttendees,
        credentialsIssued,
        credentialsRevoked,
        checkedInSet,
        activeScanners,
    ] = await Promise.all([
        Attendee.countDocuments({ workspaceId: wid, eventId: eid }),
        Attendee.countDocuments({
            workspaceId: wid,
            eventId: eid,
            registrationStatus: RegistrationStatus.REGISTERED,
        }),
        Credential.countDocuments({ workspaceId: wid, eventId: eid }),
        Credential.countDocuments({
            workspaceId: wid,
            eventId: eid,
            status: CredentialStatus.REVOKED,
        }),
        checkedInAttendeeIds(eid),
        ScannerDevice.countDocuments({
            workspaceId: wid,
            eventId: eid,
            status: {
                $in: [ScannerDeviceStatus.ONLINE, ScannerDeviceStatus.OFFLINE],
            },
            lastSeen: {
                $gte: new Date(Date.now() - ONLINE_THRESHOLD_MS),
            },
        }),
    ]);

    const checkedIn = checkedInSet.size;
    const notCheckedIn = Math.max(registeredAttendees - checkedIn, 0);
    const attendancePercent =
        registeredAttendees > 0
            ? Math.round((checkedIn / registeredAttendees) * 1000) / 10
            : 0;

    const value: EventAnalyticsOverview = {
        event: {
            id: String(event._id),
            name: event.name,
            status: event.status,
        },
        kpis: {
            totalAttendees,
            registeredAttendees,
            credentialsIssued,
            credentialsRevoked,
            checkedIn,
            notCheckedIn,
            attendancePercent,
            activeScannerDevices: activeScanners,
        },
    };

    overviewCache.set(key, {
        expiresAt: Date.now() + EVENT_ANALYTICS_CACHE_TTL_MS,
        value,
    });
    return value;
}

export function invalidateEventAnalyticsCache(
    workspaceId: string,
    eventId: string
) {
    overviewCache.delete(cacheKey(workspaceId, eventId));
}

export async function getAttendanceAnalytics(
    workspaceId: string,
    eventId: string
): Promise<AttendanceAnalytics> {
    await dbConnect();
    await getEventForWorkspace(eventId, workspaceId);
    const eid = asObjectId(eventId);
    const wid = new mongoose.Types.ObjectId(workspaceId);

    const registered = await Attendee.countDocuments({
        workspaceId: wid,
        eventId: eid,
        registrationStatus: RegistrationStatus.REGISTERED,
    });
    const checkedInSet = await checkedInAttendeeIds(eid);
    const checkedIn = checkedInSet.size;
    const attendancePercent =
        registered > 0
            ? Math.round((checkedIn / registered) * 1000) / 10
            : 0;

    const hourlyRaw = await AccessEvent.aggregate<{
        _id: { y: number; m: number; d: number; h: number };
        count: number;
    }>([
        {
            $match: {
                eventId: eid,
                type: AccessType.ENTRY,
                result: AccessResult.SUCCESS,
            },
        },
        {
            $group: {
                _id: {
                    y: { $year: "$occurredAt" },
                    m: { $month: "$occurredAt" },
                    d: { $dayOfMonth: "$occurredAt" },
                    h: { $hour: "$occurredAt" },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1, "_id.h": 1 } },
    ]);

    const hourly = hourlyRaw.map((row) => {
        const { y, m, d, h } = row._id;
        const dt = new Date(Date.UTC(y, m - 1, d, h));
        const hour = dt.toISOString();
        const label = `${m}/${d} ${String(h).padStart(2, "0")}:00`;
        return { hour, label, count: row.count };
    });

    let peakEntryTime: string | null = null;
    let peakCount = -1;
    for (const point of hourly) {
        if (point.count > peakCount) {
            peakCount = point.count;
            peakEntryTime = point.label;
        }
    }

    const totalEntries = hourly.reduce((s, p) => s + p.count, 0);
    const averageEntryRatePerHour =
        hourly.length > 0
            ? Math.round((totalEntries / hourly.length) * 10) / 10
            : 0;

    return {
        registered,
        checkedIn,
        attendancePercent,
        hourly,
        peakEntryTime,
        averageEntryRatePerHour,
    };
}

export async function getScannerAnalytics(
    workspaceId: string,
    eventId: string
): Promise<ScannerDeviceAnalytics[]> {
    await dbConnect();
    await getEventForWorkspace(eventId, workspaceId);
    const eid = asObjectId(eventId);
    const wid = new mongoose.Types.ObjectId(workspaceId);

    const devices = await ScannerDevice.find({
        workspaceId: wid,
        eventId: eid,
        status: { $ne: ScannerDeviceStatus.PAIRING },
    })
        .sort({ pairedAt: -1, createdAt: -1 })
        .lean();

    const publicIds = devices.map((d) => d.publicId);
    const scanCounts =
        publicIds.length === 0
            ? []
            : await AccessEvent.aggregate<{ _id: string; count: number }>([
                  {
                      $match: {
                          eventId: eid,
                          deviceId: { $in: publicIds },
                      },
                  },
                  { $group: { _id: "$deviceId", count: { $sum: 1 } } },
              ]);
    const countMap = new Map(scanCounts.map((c) => [c._id, c.count]));

    const User = (await import("@/models/User")).default;

    return Promise.all(
        devices.map(async (d) => {
            const status = computeDisplayStatus(
                d.status as
                    | "PAIRING"
                    | "ONLINE"
                    | "OFFLINE"
                    | "DISABLED",
                d.lastSeen
            );
            const operator = d.pairedBy
                ? await User.findById(d.pairedBy).select("name email").lean()
                : null;

            let highlight: ScannerDeviceAnalytics["highlight"] = "ok";
            if (status === ScannerDeviceStatus.DISABLED) highlight = "disabled";
            else if (status === ScannerDeviceStatus.PAIRING)
                highlight = "pairing";
            else if (status === ScannerDeviceStatus.OFFLINE)
                highlight = "offline";
            else if (
                !d.lastScanAt ||
                Date.now() - new Date(d.lastScanAt).getTime() > 30 * 60 * 1000
            ) {
                highlight = "inactive";
            }

            return {
                id: d.publicId,
                name: d.name,
                gate: d.gate || "—",
                status,
                lastSeen: d.lastSeen ? d.lastSeen.toISOString() : null,
                lastScanAt: d.lastScanAt ? d.lastScanAt.toISOString() : null,
                totalScans: countMap.get(d.publicId) || 0,
                operator: operator
                    ? {
                          name: operator.name || null,
                          email: operator.email || null,
                      }
                    : null,
                highlight,
            };
        })
    );
}

export async function getGatePerformance(
    workspaceId: string,
    eventId: string
): Promise<GatePerformanceRow[]> {
    await dbConnect();
    await getEventForWorkspace(eventId, workspaceId);
    const eid = asObjectId(eventId);

    const rows = await AccessEvent.aggregate<{
        _id: string;
        entries: number;
        deniedAttempts: number;
        lastScanAt: Date;
        successTimes: Date[];
    }>([
        { $match: { eventId: eid } },
        {
            $group: {
                _id: { $ifNull: ["$gate", "Main"] },
                entries: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$type", AccessType.ENTRY] },
                                    { $eq: ["$result", AccessResult.SUCCESS] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                deniedAttempts: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    "$result",
                                    [
                                        AccessResult.DENIED,
                                        AccessResult.INVALID_CREDENTIAL,
                                        AccessResult.REVOKED_CREDENTIAL,
                                        AccessResult.EXPIRED_CREDENTIAL,
                                        AccessResult.EVENT_NOT_OPEN,
                                    ],
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                lastScanAt: { $max: "$occurredAt" },
                successTimes: {
                    $push: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$type", AccessType.ENTRY] },
                                    { $eq: ["$result", AccessResult.SUCCESS] },
                                ],
                            },
                            "$occurredAt",
                            "$$REMOVE",
                        ],
                    },
                },
            },
        },
        { $sort: { entries: -1 } },
    ]);

    return rows.map((row) => {
        const times = (row.successTimes || [])
            .map((t) => new Date(t).getTime())
            .filter((n) => !Number.isNaN(n))
            .sort((a, b) => a - b);
        let averageIntervalSeconds: number | null = null;
        if (times.length >= 2) {
            let sum = 0;
            for (let i = 1; i < times.length; i++) {
                sum += (times[i] - times[i - 1]) / 1000;
            }
            averageIntervalSeconds =
                Math.round((sum / (times.length - 1)) * 10) / 10;
        }
        return {
            gate: row._id || "Main",
            entries: row.entries,
            deniedAttempts: row.deniedAttempts,
            averageIntervalSeconds,
            lastScanAt: row.lastScanAt
                ? new Date(row.lastScanAt).toISOString()
                : null,
        };
    });
}

export async function getCredentialAnalytics(
    workspaceId: string,
    eventId: string
): Promise<CredentialAnalytics> {
    await dbConnect();
    await getEventForWorkspace(eventId, workspaceId);
    const eid = asObjectId(eventId);
    const wid = new mongoose.Types.ObjectId(workspaceId);
    const filter = { workspaceId: wid, eventId: eid };

    const [generated, revoked, restoreAgg, downloadAgg] = await Promise.all([
        Credential.countDocuments(filter),
        Credential.countDocuments({
            ...filter,
            status: CredentialStatus.REVOKED,
        }),
        Credential.aggregate<{ total: number }>([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $ifNull: ["$restoreCount", 0] } },
                },
            },
        ]),
        Credential.aggregate<{
            downloads: number;
            png: number;
            svg: number;
        }>([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    downloads: {
                        $sum: {
                            $cond: [
                                { $ne: ["$lastDownloadedAt", null] },
                                1,
                                0,
                            ],
                        },
                    },
                    png: { $sum: { $ifNull: ["$pngDownloadCount", 0] } },
                    svg: { $sum: { $ifNull: ["$svgDownloadCount", 0] } },
                },
            },
        ]),
    ]);

    return {
        generated,
        revoked,
        restored: restoreAgg[0]?.total || 0,
        downloads: downloadAgg[0]?.downloads || 0,
        pngDownloads: downloadAgg[0]?.png || 0,
        svgDownloads: downloadAgg[0]?.svg || 0,
    };
}

export async function getAccessAnalytics(
    workspaceId: string,
    eventId: string
): Promise<AccessAnalytics> {
    await dbConnect();
    await getEventForWorkspace(eventId, workspaceId);
    const eid = asObjectId(eventId);
    const wid = new mongoose.Types.ObjectId(workspaceId);

    const [byResult, cancelledRegistrations] = await Promise.all([
        AccessEvent.aggregate<{ _id: string; count: number }>([
            { $match: { eventId: eid } },
            { $group: { _id: "$result", count: { $sum: 1 } } },
        ]),
        Attendee.countDocuments({
            workspaceId: wid,
            eventId: eid,
            registrationStatus: RegistrationStatus.CANCELLED,
        }),
    ]);

    const map = new Map(byResult.map((r) => [r._id, r.count]));
    const successfulEntries = await AccessEvent.countDocuments({
        eventId: eid,
        type: AccessType.ENTRY,
        result: AccessResult.SUCCESS,
    });

    return {
        successfulEntries,
        deniedAttempts: map.get(AccessResult.DENIED) || 0,
        alreadyEntered: map.get(AccessResult.ALREADY_ENTERED) || 0,
        invalidCredentials: map.get(AccessResult.INVALID_CREDENTIAL) || 0,
        revokedCredentials: map.get(AccessResult.REVOKED_CREDENTIAL) || 0,
        expiredCredentials: map.get(AccessResult.EXPIRED_CREDENTIAL) || 0,
        cancelledRegistrations,
    };
}

export async function getRecentActivity(
    workspaceId: string,
    eventId: string,
    page = 1
): Promise<{ items: ActivityItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    await dbConnect();
    await getEventForWorkspace(eventId, workspaceId);
    const eid = asObjectId(eventId);
    const wid = new mongoose.Types.ObjectId(workspaceId);
    const limit = ACTIVITY_PAGE_SIZE;
    const safePage = Math.max(1, page);

    const [accessDocs, credentials, scanners] = await Promise.all([
        AccessEvent.find({ eventId: eid })
            .sort({ occurredAt: -1 })
            .limit(200)
            .lean(),
        Credential.find({ workspaceId: wid, eventId: eid })
            .sort({ updatedAt: -1 })
            .limit(100)
            .lean(),
        ScannerDevice.find({
            workspaceId: wid,
            eventId: eid,
            pairedAt: { $ne: null },
        })
            .sort({ pairedAt: -1 })
            .limit(50)
            .lean(),
    ]);

    const attendeeIds = [
        ...new Set(
            accessDocs
                .map((a) => a.attendeeId)
                .filter(Boolean)
                .map((id) => String(id))
        ),
    ];
    const attendees =
        attendeeIds.length > 0
            ? await Attendee.find({
                  _id: {
                      $in: attendeeIds.map(
                          (id) => new mongoose.Types.ObjectId(id)
                      ),
                  },
              })
                  .select("publicId firstName lastName")
                  .lean()
            : [];
    const attendeeMap = new Map(
        attendees.map((a) => [
            String(a._id),
            `${a.firstName} ${a.lastName}`.trim() || a.publicId,
        ])
    );

    const items: ActivityItem[] = [];

    for (const a of accessDocs) {
        const name = a.attendeeId
            ? attendeeMap.get(String(a.attendeeId)) || "Attendee"
            : "Unknown";
        const manual = Boolean(
            a.metadata &&
                typeof a.metadata === "object" &&
                (a.metadata as { manual?: boolean }).manual
        );
        let title = "Access attempt";
        let type = "ACCESS";
        if (a.result === AccessResult.SUCCESS && a.type === AccessType.ENTRY) {
            title = manual ? "Manual check-in" : "Attendee checked in";
            type = manual ? "MANUAL_ENTRY" : "CHECK_IN";
        } else if (
            a.result === AccessResult.SUCCESS &&
            a.type === AccessType.EXIT
        ) {
            title = manual ? "Manual check-out" : "Attendee checked out";
            type = manual ? "MANUAL_EXIT" : "CHECK_OUT";
        } else if (a.result === AccessResult.ALREADY_ENTERED) {
            title = "Already entered";
            type = "ALREADY_ENTERED";
        } else {
            title = "Access denied";
            type = "DENIED";
        }
        items.push({
            id: `acc_${a.publicId}`,
            type,
            title,
            detail: `${name} · ${a.gate || "Main"} · ${a.result}`,
            occurredAt: a.occurredAt.toISOString(),
        });
    }

    for (const c of credentials) {
        items.push({
            id: `cred_gen_${c.publicId}`,
            type: "CREDENTIAL_GENERATED",
            title: "Credential generated",
            detail: c.publicId,
            occurredAt: c.generatedAt.toISOString(),
        });
        if (c.revokedAt) {
            items.push({
                id: `cred_rev_${c.publicId}_${c.revokedAt.getTime()}`,
                type: "CREDENTIAL_REVOKED",
                title: "Credential revoked",
                detail: `${c.publicId}${c.revokedReason ? ` · ${c.revokedReason}` : ""}`,
                occurredAt: c.revokedAt.toISOString(),
            });
        }
    }

    for (const s of scanners) {
        if (!s.pairedAt) continue;
        items.push({
            id: `scd_${s.publicId}`,
            type: "SCANNER_PAIRED",
            title: "Scanner paired",
            detail: `${s.name} · ${s.gate || "Gate pending"}`,
            occurredAt: s.pairedAt.toISOString(),
        });
    }

    items.sort(
        (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (safePage - 1) * limit;
    const pageItems = items.slice(start, start + limit);

    return {
        items: pageItems,
        pagination: { page: safePage, limit, total, totalPages },
    };
}

export async function searchEventOps(
    workspaceId: string,
    eventId: string,
    q: string,
    page = 1
): Promise<{
    items: SearchHit[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
    await dbConnect();
    await getEventForWorkspace(eventId, workspaceId);
    const eid = asObjectId(eventId);
    const wid = new mongoose.Types.ObjectId(workspaceId);
    const query = q.trim();
    if (!query) {
        return {
            items: [],
            pagination: { page: 1, limit: SEARCH_PAGE_SIZE, total: 0, totalPages: 1 },
        };
    }

    const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const [attendees, credentials, access] = await Promise.all([
        Attendee.find({
            workspaceId: wid,
            eventId: eid,
            $or: [
                { firstName: rx },
                { lastName: rx },
                { email: rx },
                { publicId: rx },
                { company: rx },
            ],
        })
            .limit(50)
            .lean(),
        Credential.find({
            workspaceId: wid,
            eventId: eid,
            publicId: rx,
        })
            .limit(50)
            .lean(),
        AccessEvent.find({
            eventId: eid,
            $or: [{ publicId: rx }, { gate: rx }, { notes: rx }],
        })
            .limit(50)
            .lean(),
    ]);

    const hits: SearchHit[] = [];
    for (const a of attendees) {
        hits.push({
            kind: "attendee",
            id: a.publicId,
            title: `${a.firstName} ${a.lastName}`.trim(),
            subtitle: `${a.email} · ${a.registrationStatus}`,
            href: `/events/${eventId}/attendees/${a.publicId}`,
        });
    }
    for (const c of credentials) {
        hits.push({
            kind: "credential",
            id: c.publicId,
            title: c.publicId,
            subtitle: `Status ${c.status}`,
            href: `/events/${eventId}/attendees`,
        });
    }
    for (const a of access) {
        hits.push({
            kind: "access",
            id: a.publicId,
            title: `${a.type} · ${a.result}`,
            subtitle: `${a.gate} · ${a.occurredAt.toISOString()}`,
            href: `/events/${eventId}/access`,
        });
    }

    const limit = SEARCH_PAGE_SIZE;
    const safePage = Math.max(1, page);
    const total = hits.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (safePage - 1) * limit;

    return {
        items: hits.slice(start, start + limit),
        pagination: { page: safePage, limit, total, totalPages },
    };
}

function csvEscape(value: unknown): string {
    const s = value == null ? "" : String(value);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const lines = [
        headers.join(","),
        ...rows.map((row) =>
            headers.map((h) => csvEscape(row[h])).join(",")
        ),
    ];
    return lines.join("\n");
}

export async function exportAttendeesCsv(
    workspaceId: string,
    eventId: string
): Promise<string> {
    await dbConnect();
    await getEventForWorkspace(eventId, workspaceId);
    const eid = asObjectId(eventId);
    const wid = new mongoose.Types.ObjectId(workspaceId);
    const checkedIn = await checkedInAttendeeIds(eid);
    const attendees = await Attendee.find({ workspaceId: wid, eventId: eid })
        .sort({ createdAt: 1 })
        .lean();

    return toCsv(
        attendees.map((a) => ({
            publicId: a.publicId,
            firstName: a.firstName,
            lastName: a.lastName,
            email: a.email,
            phone: a.phone || "",
            company: a.company || "",
            ticketType: a.ticketType || "",
            registrationStatus: a.registrationStatus,
            checkedIn: checkedIn.has(String(a._id)) ? "yes" : "no",
            createdAt: a.createdAt?.toISOString?.() || "",
        }))
    );
}

export async function exportAccessLogsCsv(
    workspaceId: string,
    eventId: string
): Promise<string> {
    await dbConnect();
    await getEventForWorkspace(eventId, workspaceId);
    const eid = asObjectId(eventId);
    const logs = await AccessEvent.find({ eventId: eid })
        .sort({ occurredAt: -1 })
        .limit(10000)
        .lean();

    const attendeeIds = [
        ...new Set(
            logs
                .map((l) => l.attendeeId)
                .filter(Boolean)
                .map((id) => String(id))
        ),
    ];
    const attendees =
        attendeeIds.length > 0
            ? await Attendee.find({
                  _id: {
                      $in: attendeeIds.map(
                          (id) => new mongoose.Types.ObjectId(id)
                      ),
                  },
              })
                  .select("publicId firstName lastName email")
                  .lean()
            : [];
    const map = new Map(attendees.map((a) => [String(a._id), a]));

    return toCsv(
        logs.map((l) => {
            const a = l.attendeeId ? map.get(String(l.attendeeId)) : null;
            return {
                publicId: l.publicId,
                type: l.type,
                result: l.result,
                gate: l.gate,
                deviceId: l.deviceId || "",
                attendeePublicId: a?.publicId || "",
                attendeeName: a
                    ? `${a.firstName} ${a.lastName}`.trim()
                    : "",
                attendeeEmail: a?.email || "",
                notes: l.notes || "",
                occurredAt: l.occurredAt.toISOString(),
            };
        })
    );
}

export async function exportCredentialsCsv(
    workspaceId: string,
    eventId: string
): Promise<string> {
    await dbConnect();
    await getEventForWorkspace(eventId, workspaceId);
    const eid = asObjectId(eventId);
    const wid = new mongoose.Types.ObjectId(workspaceId);
    const credentials = await Credential.find({
        workspaceId: wid,
        eventId: eid,
    })
        .sort({ generatedAt: -1 })
        .lean();

    const attendeeIds = credentials.map((c) => c.attendeeId);
    const attendees =
        attendeeIds.length > 0
            ? await Attendee.find({ _id: { $in: attendeeIds } })
                  .select("publicId firstName lastName email")
                  .lean()
            : [];
    const map = new Map(attendees.map((a) => [String(a._id), a]));

    return toCsv(
        credentials.map((c) => {
            const a = map.get(String(c.attendeeId));
            return {
                publicId: c.publicId,
                status: c.status,
                tokenVersion: c.tokenVersion,
                attendeePublicId: a?.publicId || "",
                attendeeName: a
                    ? `${a.firstName} ${a.lastName}`.trim()
                    : "",
                attendeeEmail: a?.email || "",
                generatedAt: c.generatedAt.toISOString(),
                revokedAt: c.revokedAt ? c.revokedAt.toISOString() : "",
                lastDownloadedAt: c.lastDownloadedAt
                    ? c.lastDownloadedAt.toISOString()
                    : "",
                pngDownloads: c.pngDownloadCount || 0,
                svgDownloads: c.svgDownloadCount || 0,
                restoreCount: c.restoreCount || 0,
            };
        })
    );
}
