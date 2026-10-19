export function FitBar({
  label,
  value,
  tone,
  variant = "light",
  size = "md",
}: {
  label: string;
  value: number;
  tone: "navy" | "red";
  variant?: "light" | "on-dark";
  size?: "md" | "lg";
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const fill =
    variant === "on-dark"
      ? tone === "navy"
        ? "bg-white"
        : "bg-red"
      : tone === "navy"
        ? "bg-navy"
        : "bg-red";
  const track = variant === "on-dark" ? "bg-white/20" : "bg-line";
  const labelClass =
    variant === "on-dark" ? "text-white/75" : "text-muted";
  const valueClass =
    variant === "on-dark"
      ? "text-white"
      : "text-ink";
  const h = size === "lg" ? "h-3" : "h-2";

  return (
    <div className="w-full min-w-[140px]">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className={`text-xs font-semibold ${labelClass}`}>{label}</span>
        <span
          className={`font-mono font-bold tabular-nums ${valueClass} ${
            size === "lg" ? "text-lg" : "text-sm"
          }`}
        >
          {v}
        </span>
      </div>
      <div
        className={`${h} overflow-hidden rounded-full ${track}`}
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} ${v}`}
      >
        <div
          className={`fit-bar-fill h-full rounded-full ${fill}`}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}
