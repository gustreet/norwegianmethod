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
      <p className={`mb-1.5 text-xs font-semibold ${labelClass}`}>{label}</p>
      <div className="flex items-center gap-2">
        <div
          className={`min-w-0 flex-1 ${h} overflow-hidden rounded-full ${track}`}
          role="progressbar"
          aria-valuenow={v}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label} ${v} out of 100`}
        >
          <div
            className={`fit-bar-fill h-full w-full origin-left rounded-full ${fill}`}
            style={{ transform: `scaleX(${v / 100})` }}
          />
        </div>
        <span
          className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${valueClass}`}
        >
          {v}
          <span className="font-normal text-muted">/100</span>
        </span>
      </div>
    </div>
  );
}
