type HeaderConfig = {
    logoUrl?: string;
    title?: string;
    subtitle?: string;
    headerStyle?: "centered" | "left";
};

export function HeaderBlock({ config }: { config: Record<string, unknown> }) {
    const c = config as HeaderConfig;
    const align = c.headerStyle === "left" ? "text-left items-start" : "text-center items-center";

    return (
        <header className={`flex flex-col gap-3 ${align}`}>
            {c.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={c.logoUrl}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover"
                />
            ) : null}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {c.title || "Welcome"}
                </h1>
                {c.subtitle ? (
                    <p className="mt-1 text-sm text-slate-500">{c.subtitle}</p>
                ) : null}
            </div>
        </header>
    );
}
