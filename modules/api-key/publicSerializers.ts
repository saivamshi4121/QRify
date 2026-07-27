/** Serialize mongoose lean event docs for public API. */
export function publicEvent(doc: Record<string, unknown>) {
    return {
        id: String(doc._id),
        name: doc.name,
        slug: doc.slug,
        description: doc.description || "",
        venue: doc.venue || "",
        timezone: doc.timezone,
        startDate: doc.startDate
            ? new Date(doc.startDate as Date).toISOString()
            : null,
        endDate: doc.endDate
            ? new Date(doc.endDate as Date).toISOString()
            : null,
        status: doc.status,
        createdAt: doc.createdAt
            ? new Date(doc.createdAt as Date).toISOString()
            : null,
        updatedAt: doc.updatedAt
            ? new Date(doc.updatedAt as Date).toISOString()
            : null,
    };
}
