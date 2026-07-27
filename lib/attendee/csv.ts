/** Minimal CSV parser: supports commas and double-quoted fields. */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const parsed = lines.map(parseCsvLine);
    const headers = parsed[0].map((h) => h.trim());
    const rows = parsed.slice(1).map((row) => {
        // pad/truncate to header length
        const next = [...row];
        while (next.length < headers.length) next.push("");
        return next.slice(0, headers.length).map((c) => c.trim());
    });
    return { headers, rows };
}

function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"') {
                if (line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ",") {
            result.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

export type FieldKey =
    | "firstName"
    | "lastName"
    | "name"
    | "email"
    | "phone"
    | "company"
    | "designation"
    | "ticketType";

export const MAP_FIELDS: { key: FieldKey; label: string; required?: boolean }[] =
    [
        { key: "email", label: "Email", required: true },
        { key: "name", label: "Full Name" },
        { key: "firstName", label: "First Name" },
        { key: "lastName", label: "Last Name" },
        { key: "phone", label: "Phone" },
        { key: "company", label: "Company" },
        { key: "designation", label: "Designation" },
        { key: "ticketType", label: "Ticket" },
    ];

/** Guess column map from header names. */
export function guessColumnMap(
    headers: string[]
): Partial<Record<FieldKey, string>> {
    const map: Partial<Record<FieldKey, string>> = {};
    const lower = headers.map((h) => h.toLowerCase());

    const find = (...needles: string[]) => {
        const idx = lower.findIndex((h) => needles.some((n) => h.includes(n)));
        return idx >= 0 ? headers[idx] : undefined;
    };

    map.email = find("email", "e-mail");
    map.firstName = find("first name", "firstname", "first");
    map.lastName = find("last name", "lastname", "surname");
    map.name = find("full name", "name");
    map.phone = find("phone", "mobile", "tel");
    map.company = find("company", "organization", "org");
    map.designation = find("designation", "title", "role", "job");
    map.ticketType = find("ticket", "pass", "type");

    return map;
}
