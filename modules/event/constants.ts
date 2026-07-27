export const EventStatus = {
    DRAFT: "DRAFT",
    PUBLISHED: "PUBLISHED",
    COMPLETED: "COMPLETED",
    ARCHIVED: "ARCHIVED",
} as const;

export type EventStatusValue =
    (typeof EventStatus)[keyof typeof EventStatus];

export const EVENT_STATUS_VALUES = Object.values(EventStatus);

/** Roles allowed to create / edit / delete / archive events. */
export const EVENT_MANAGE_ROLES = ["owner", "admin"] as const;
