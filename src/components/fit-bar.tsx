export function FitBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "navy" | "red";
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const fill = tone === "navy" ? "bg-navy" : "bg-red";
  return (
    <div className="w-full min-w-[140px]">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="font-mono text-sm font-semibold text-ink">{v}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} ${v}`}
      >
        <div
          className={`h-full rounded-full ${fill} transition-[width] duration-300 ease-out`}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}
