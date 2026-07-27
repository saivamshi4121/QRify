import mongoose from "mongoose";
import Attendee from "@/models/Attendee";
import Event from "@/models/Event";

type EventData = Record<string, unknown>;

/**
 * Enrich domain event data with attendee/event fields needed for templates.
 */
export async function enrichNotificationData(
    workspaceId: string,
    data: EventData
): Promise<EventData> {
    const enriched: EventData = { ...data };

    const attendeeNested = data.attendee as EventData | undefined;
    const attendeeKey =
        data.attendeeId ||
        data.publicId ||
        data.id ||
        attendeeNested?.publicId ||
        attendeeNested?.id;

    if (attendeeKey && typeof attendeeKey === "string" && !data.email) {
        const attendee = await Attendee.findOne({
            workspaceId,
            publicId: attendeeKey,
        })
            .select("publicId firstName lastName email phone ticketType")
            .lean();
        if (attendee) {
            enriched.firstName = attendee.firstName;
            enriched.lastName = attendee.lastName;
            enriched.email = attendee.email;
            enriched.phone = attendee.phone;
            enriched.ticketType = attendee.ticketType;
            enriched.id = attendee.publicId;
            enriched.publicId = attendee.publicId;
        }
    }

    if (attendeeNested) {
        if (!enriched.firstName && attendeeNested.firstName) {
            enriched.firstName = attendeeNested.firstName;
        }
        if (!enriched.lastName && attendeeNested.lastName) {
            enriched.lastName = attendeeNested.lastName;
        }
        if (!enriched.email && attendeeNested.email) {
            enriched.email = attendeeNested.email;
        }
        if (!enriched.phone && attendeeNested.phone) {
            enriched.phone = attendeeNested.phone;
        }
    }

    const eventId = data.eventId || data.id;
    if (eventId && typeof eventId === "string") {
        const isObjectId = mongoose.Types.ObjectId.isValid(eventId);
        const event = isObjectId
            ? await Event.findOne({ _id: eventId, workspaceId })
                  .select("name venue startDate endDate")
                  .lean()
            : null;
        if (event) {
            if (!enriched.eventName) enriched.eventName = event.name;
            if (!enriched.name) enriched.name = event.name;
            if (!enriched.venue) enriched.venue = event.venue;
            if (!enriched.eventDate && event.startDate) {
                enriched.eventDate = event.startDate;
            }
            if (!enriched.startDate && event.startDate) {
                enriched.startDate = event.startDate;
            }
            if (!enriched.eventEndDate && event.endDate) {
                enriched.eventEndDate = event.endDate;
            }
        }
    }

    if (!enriched.eventName && typeof data.name === "string") {
        enriched.eventName = data.name;
    }

    const accessEvent = data.accessEvent as EventData | undefined;
    if (accessEvent?.occurredAt && !enriched.checkInTime) {
        enriched.checkInTime = String(accessEvent.occurredAt);
    }

    return enriched;
}
