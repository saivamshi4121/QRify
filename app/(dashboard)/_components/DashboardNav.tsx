import { DASHBOARD_NAV_ITEMS } from "./dashboard-nav";
import { DashboardNavLink } from "./DashboardNavLink";

/** Server-rendered nav list; each link is a small client island for active state. */
export function DashboardNav() {
    return (
        <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Main">
            {DASHBOARD_NAV_ITEMS.map((item) => (
                <DashboardNavLink
                    key={item.href}
                    href={item.href}
                    name={item.name}
                    icon={item.icon}
                />
            ))}
        </nav>
    );
}
