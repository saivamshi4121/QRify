/**
 * Grouped navigation structure for the sidebar.
 * Groups with `group: true` are rendered as collapsible sections.
 * Items without a group are rendered as top-level links.
 */

export type NavItem = {
    name: string;
    href: string;
    icon: NavIcon;
};

export type NavGroup = {
    label: string;
    icon: NavIcon;
    items: NavItem[];
};

export type NavEntry = NavItem | NavGroup;

// All icon keys used (both top-level and nested)
export const NAV_ICONS = [
    "dashboard",
    "analytics",
    "events",
    "qrs",
    "pages",
    "feedback",
    "create",
    "settings",
    "notifications",
    "apikeys",
    "webhooks",
    "explorer",
    "docs",
    "workspace",
] as const;

export type NavIcon = (typeof NAV_ICONS)[number];

export function isNavGroup(entry: NavEntry): entry is NavGroup {
    return "items" in entry;
}

export const DASHBOARD_NAV: NavEntry[] = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },

    {
        label: "Events",
        icon: "events",
        items: [
            { name: "All Events", href: "/events", icon: "events" },
            { name: "Analytics", href: "/analytics", icon: "analytics" },
        ],
    },

    { name: "Review Pages", href: "/smart-pages", icon: "pages" },
    { name: "QR Codes", href: "/qrs", icon: "qrs" },
    { name: "Notifications", href: "/settings/notifications", icon: "notifications" },

    {
        label: "Developer",
        icon: "apikeys",
        items: [
            { name: "API Keys & Webhooks", href: "/settings/developer", icon: "apikeys" },
            { name: "API Explorer", href: "/settings/developer/explorer", icon: "explorer" },
        ],
    },

    { name: "Settings", href: "/settings", icon: "settings" },
];

// Keep old flat list for any consumers that still use it
export const DASHBOARD_NAV_ITEMS = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" as NavIcon },
    { name: "Analytics", href: "/analytics", icon: "analytics" as NavIcon },
    { name: "Events", href: "/events", icon: "events" as NavIcon },
    { name: "My QRs", href: "/qrs", icon: "qrs" as NavIcon },
    { name: "Review Pages", href: "/smart-pages", icon: "pages" as NavIcon },
    { name: "Feedback", href: "/feedback", icon: "feedback" as NavIcon },
    { name: "Create QR", href: "/create", icon: "create" as NavIcon },
    { name: "Settings", href: "/settings", icon: "settings" as NavIcon },
];

export type DashboardNavIcon = NavIcon;
