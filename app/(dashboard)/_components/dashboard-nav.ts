export const DASHBOARD_NAV_ITEMS = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Analytics", href: "/analytics", icon: "analytics" },
    { name: "Events", href: "/events", icon: "events" },
    { name: "My QRs", href: "/qrs", icon: "qrs" },
    { name: "Review Pages", href: "/smart-pages", icon: "pages" },
    { name: "Feedback", href: "/feedback", icon: "feedback" },
    { name: "Create QR", href: "/create", icon: "create" },
    { name: "Settings", href: "/settings", icon: "settings" },
] as const;

export type DashboardNavIcon = (typeof DASHBOARD_NAV_ITEMS)[number]["icon"];
