type TextConfig = {
    body?: string;
    align?: "left" | "center" | "right";
};

export function TextBlock({ config }: { config: Record<string, unknown> }) {
    const c = config as TextConfig;
    const align =
        c.align === "center"
            ? "text-center"
            : c.align === "right"
              ? "text-right"
              : "text-left";

    return (
        <div className={`whitespace-pre-wrap text-base leading-relaxed text-slate-700 ${align}`}>
            {c.body || ""}
        </div>
    );
}
