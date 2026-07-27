export const SCANNER_STORAGE_KEY = "qrezo.scanner.selection.v1";

export type ScannerSelection = {
    workspaceId: string;
    workspaceName: string;
    eventId: string;
    eventName: string;
    gate: string;
};

export function loadSelection(): ScannerSelection | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(SCANNER_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as ScannerSelection;
        if (
            !parsed.workspaceId ||
            !parsed.eventId ||
            !parsed.gate
        ) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

export function saveSelection(selection: ScannerSelection) {
    localStorage.setItem(SCANNER_STORAGE_KEY, JSON.stringify(selection));
}

export function clearSelection() {
    localStorage.removeItem(SCANNER_STORAGE_KEY);
}

export const DEFAULT_GATES = [
    "Main",
    "VIP",
    "Staff",
    "Backstage",
    "Exit",
];
