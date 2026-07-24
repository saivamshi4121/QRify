"use client";

import { BlockType } from "@/modules/smartpage/constants";

type BlockConfigFormProps = {
    blockType: BlockType | string;
    config: Record<string, unknown>;
    title?: string;
    isVisible?: boolean;
    onChange: (next: {
        config: Record<string, unknown>;
        title?: string;
        isVisible?: boolean;
    }) => void;
};

function str(config: Record<string, unknown>, key: string, fallback = "") {
    const v = config[key];
    return typeof v === "string" ? v : fallback;
}

function num(config: Record<string, unknown>, key: string, fallback: number) {
    const v = config[key];
    return typeof v === "number" ? v : fallback;
}

function bool(config: Record<string, unknown>, key: string, fallback: boolean) {
    const v = config[key];
    return typeof v === "boolean" ? v : fallback;
}

export function BlockConfigForm({
    blockType,
    config,
    title = "",
    isVisible = true,
    onChange,
}: BlockConfigFormProps) {
    function patchConfig(partial: Record<string, unknown>) {
        onChange({
            config: { ...config, ...partial },
            title,
            isVisible,
        });
    }

    return (
        <div className="space-y-3">
            <label className="block text-sm">
                <span className="text-slate-600">Block title (optional)</span>
                <input
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={title}
                    onChange={(e) =>
                        onChange({ config, title: e.target.value, isVisible })
                    }
                />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) =>
                        onChange({
                            config,
                            title,
                            isVisible: e.target.checked,
                        })
                    }
                />
                Visible on public page
            </label>

            {blockType === "header" && (
                <>
                    <Field
                        label="Title"
                        value={str(config, "title", "Welcome")}
                        onChange={(v) => patchConfig({ title: v })}
                    />
                    <Field
                        label="Subtitle"
                        value={str(config, "subtitle")}
                        onChange={(v) => patchConfig({ subtitle: v })}
                    />
                    <Field
                        label="Logo URL"
                        value={str(config, "logoUrl")}
                        onChange={(v) => patchConfig({ logoUrl: v })}
                    />
                    <SelectField
                        label="Style"
                        value={str(config, "headerStyle", "centered")}
                        options={[
                            { value: "centered", label: "Centered" },
                            { value: "left", label: "Left" },
                        ]}
                        onChange={(v) => patchConfig({ headerStyle: v })}
                    />
                </>
            )}

            {blockType === "text" && (
                <>
                    <label className="block text-sm">
                        <span className="text-slate-600">Body</span>
                        <textarea
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                            rows={4}
                            value={str(config, "body")}
                            onChange={(e) => patchConfig({ body: e.target.value })}
                        />
                    </label>
                    <SelectField
                        label="Align"
                        value={str(config, "align", "left")}
                        options={[
                            { value: "left", label: "Left" },
                            { value: "center", label: "Center" },
                            { value: "right", label: "Right" },
                        ]}
                        onChange={(v) => patchConfig({ align: v })}
                    />
                </>
            )}

            {blockType === "rating" && (
                <>
                    <Field
                        label="Question"
                        value={str(
                            config,
                            "questionPrompt",
                            "How was your experience today?"
                        )}
                        onChange={(v) => patchConfig({ questionPrompt: v })}
                    />
                    <Field
                        label="Google threshold (min score)"
                        type="number"
                        value={String(num(config, "negativeThreshold", 4))}
                        onChange={(v) =>
                            patchConfig({
                                negativeThreshold: Math.min(
                                    5,
                                    Math.max(1, Number(v) || 4)
                                ),
                            })
                        }
                    />
                    <Field
                        label="Accent color"
                        value={str(config, "accentColor", "#f59e0b")}
                        onChange={(v) => patchConfig({ accentColor: v })}
                    />
                </>
            )}

            {blockType === "google_review" && (
                <>
                    <Field
                        label="Button text"
                        value={str(config, "buttonText", "Leave a Google Review")}
                        onChange={(v) => patchConfig({ buttonText: v })}
                    />
                    <Field
                        label="Custom review URL"
                        value={str(config, "customReviewUrl")}
                        onChange={(v) => patchConfig({ customReviewUrl: v })}
                    />
                    <Field
                        label="Google Place ID"
                        value={str(config, "googlePlaceId")}
                        onChange={(v) => patchConfig({ googlePlaceId: v })}
                    />
                </>
            )}

            {blockType === "feedback_form" && (
                <>
                    <Field
                        label="Placeholder"
                        value={str(
                            config,
                            "placeholder",
                            "Tell us what we can improve…"
                        )}
                        onChange={(v) => patchConfig({ placeholder: v })}
                    />
                    <Field
                        label="Categories (comma-separated)"
                        value={(Array.isArray(config.categories)
                            ? (config.categories as string[])
                            : ["Food", "Service", "Ambience"]
                        ).join(", ")}
                        onChange={(v) =>
                            patchConfig({
                                categories: v
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                            })
                        }
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={bool(config, "requirePhone", false)}
                            onChange={(e) =>
                                patchConfig({ requirePhone: e.target.checked })
                            }
                        />
                        Require phone
                    </label>
                </>
            )}
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
}) {
    return (
        <label className="block text-sm">
            <span className="text-slate-600">{label}</span>
            <input
                type={type}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </label>
    );
}

function SelectField({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
}) {
    return (
        <label className="block text-sm">
            <span className="text-slate-600">{label}</span>
            <select
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
