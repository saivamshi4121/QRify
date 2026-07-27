export type EventAnalyticsOverview = {
    event: { id: string; name: string; status: string };
    kpis: {
        totalAttendees: number;
        registeredAttendees: number;
        credentialsIssued: number;
        credentialsRevoked: number;
        checkedIn: number;
        notCheckedIn: number;
        attendancePercent: number;
        activeScannerDevices: number;
    };
};

export type HourlyAttendancePoint = {
    hour: string;
    label: string;
    count: number;
};

export type AttendanceAnalytics = {
    registered: number;
    checkedIn: number;
    attendancePercent: number;
    hourly: HourlyAttendancePoint[];
    peakEntryTime: string | null;
    averageEntryRatePerHour: number;
};

export type ScannerDeviceAnalytics = {
    id: string;
    name: string;
    gate: string;
    status: string;
    lastSeen: string | null;
    lastScanAt: string | null;
    totalScans: number;
    operator: { name: string | null; email: string | null } | null;
    highlight: "offline" | "inactive" | "ok" | "pairing" | "disabled";
};

export type GatePerformanceRow = {
    gate: string;
    entries: number;
    deniedAttempts: number;
    averageIntervalSeconds: number | null;
    lastScanAt: string | null;
};

export type CredentialAnalytics = {
    generated: number;
    revoked: number;
    restored: number;
    downloads: number;
    pngDownloads: number;
    svgDownloads: number;
};

export type AccessAnalytics = {
    successfulEntries: number;
    deniedAttempts: number;
    alreadyEntered: number;
    invalidCredentials: number;
    revokedCredentials: number;
    expiredCredentials: number;
    cancelledRegistrations: number;
};

export type ActivityItem = {
    id: string;
    type: string;
    title: string;
    detail: string;
    occurredAt: string;
};

export type SearchHit = {
    kind: "attendee" | "credential" | "access";
    id: string;
    title: string;
    subtitle: string;
    href: string;
};
