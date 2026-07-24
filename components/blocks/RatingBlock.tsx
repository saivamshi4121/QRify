"use client";

type RatingConfig = {
    questionPrompt?: string;
    starCount?: number;
    accentColor?: string;
};

type RatingBlockProps = {
    config: Record<string, unknown>;
    value?: number | null;
    onRate?: (score: number) => void;
    disabled?: boolean;
};

export function RatingBlock({
    config,
    value = null,
    onRate,
    disabled = false,
}: RatingBlockProps) {
    const c = config as RatingConfig;
    const count = Math.min(Math.max(c.starCount ?? 5, 1), 5);
    const color = c.accentColor || "#f59e0b";

    return (
        <section className="space-y-3 text-center">
            <p className="text-base font-medium text-slate-800">
                {c.questionPrompt || "How was your experience today?"}
            </p>
            <div className="flex justify-center gap-2">
                {Array.from({ length: count }).map((_, i) => {
                    const score = i + 1;
                    const filled = value !== null && score <= value;
                    return (
                        <button
                            key={score}
                            type="button"
                            disabled={disabled || !onRate}
                            onClick={() => onRate?.(score)}
                            className="text-3xl transition-transform hover:scale-110 disabled:cursor-default disabled:hover:scale-100"
                            style={{ color: filled ? color : "#cbd5e1" }}
                            aria-label={`Rate ${score} stars`}
                        >
                            ★
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
