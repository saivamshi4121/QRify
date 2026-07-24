type GoogleReviewConfig = {
    buttonText?: string;
    customReviewUrl?: string;
    googlePlaceId?: string;
};

export function GoogleReviewBlock({ config }: { config: Record<string, unknown> }) {
    const c = config as GoogleReviewConfig;
    const href =
        c.customReviewUrl ||
        (c.googlePlaceId
            ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(c.googlePlaceId)}`
            : undefined);

    if (!href) {
        return (
            <p className="text-center text-sm text-slate-400">
                Google review link not configured
            </p>
        );
    }

    return (
        <div className="text-center">
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white"
            >
                {c.buttonText || "Leave a Google Review"}
            </a>
        </div>
    );
}
