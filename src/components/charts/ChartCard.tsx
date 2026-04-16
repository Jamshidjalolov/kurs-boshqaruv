import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { ChartDatum } from "@/types/domain";
import { Card } from "@/components/common/Card";
import { cn } from "@/lib/cn";

interface ChartCardProps {
  title: string;
  description: string;
  data: ChartDatum[];
  valueFormatter?: (value: number) => string;
  deltaFormatter?: (value: number) => string;
  averageFormatter?: (selectedValue: number, averageValue: number) => string;
}

type Point = {
  x: number;
  y: number;
};

function isIsoDateLabel(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatChartDate(value: string, options: Intl.DateTimeFormatOptions) {
  if (!isIsoDateLabel(value)) {
    return value;
  }

  return new Intl.DateTimeFormat("uz-UZ", options).format(new Date(`${value}T12:00:00`));
}

function formatChartLabelShort(value: string) {
  return formatChartDate(value, {
    day: "numeric",
    month: "short"
  });
}

function formatChartLabelLong(value: string) {
  return formatChartDate(value, {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

function formatChartLabelMeta(value: string) {
  return formatChartDate(value, {
    year: "numeric"
  });
}

function formatChartLabelWeekday(value: string) {
  return formatChartDate(value, {
    weekday: "short"
  });
}

export function ChartCard({ title, description, data, valueFormatter, deltaFormatter, averageFormatter }: ChartCardProps) {
  const chartId = useId().replace(/:/g, "");
  const safeData = data.length ? data : [{ label: "Ma'lumot yo'q", value: 0 }];
  const [selectedIndex, setSelectedIndex] = useState(Math.max(safeData.length - 1, 0));

  useEffect(() => {
    setSelectedIndex(Math.max(data.length - 1, 0));
  }, [data]);

  const values = safeData.map((item) => item.value);
  const maxValue = Math.max(...values, 100);
  const average = Math.round(values.reduce((sum, value) => sum + value, 0) / safeData.length);
  const opening = values[0] ?? 0;
  const current = values.at(-1) ?? 0;
  const delta = current - opening;
  const TrendIcon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  const formatValue = valueFormatter ?? ((value: number) => `${value}%`);
  const trendCopy = deltaFormatter
    ? deltaFormatter(delta)
    : delta > 0
      ? `+${delta}% o'sish`
      : delta < 0
        ? `${delta}% pasayish`
        : "Barqaror";
  const trendTone =
    delta > 0
      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
      : delta < 0
        ? "border-rose-500/30 bg-rose-500/15 text-rose-200"
        : "border-white/10 bg-white/10 text-slate-200";

  const activeIndex = Math.min(selectedIndex, safeData.length - 1);
  const selectedItem = safeData[activeIndex] ?? safeData.at(-1) ?? { label: "Ma'lumot yo'q", value: 0 };
  const previousValue = activeIndex > 0 ? values[activeIndex - 1] : selectedItem.value;
  const pointDelta = selectedItem.value - previousValue;
  const pointDeltaCopy =
    deltaFormatter && activeIndex !== 0
      ? `Oldingi nuqtaga nisbatan ${deltaFormatter(pointDelta)}`
      : activeIndex === 0
        ? "Boshlang'ich nuqta"
        : pointDelta > 0
          ? `Oldingi kunga nisbatan +${pointDelta}%`
          : pointDelta < 0
            ? `Oldingi kunga nisbatan ${pointDelta}%`
            : "Oldingi kun bilan bir xil";
  const averageGap = selectedItem.value - average;
  const averageCopy = averageFormatter
    ? averageFormatter(selectedItem.value, average)
    : averageGap > 0
      ? `O'rtachadan ${averageGap}% yuqori`
      : averageGap < 0
        ? `O'rtachadan ${Math.abs(averageGap)}% past`
        : "O'rtacha bilan teng";

  const chartWidth = 640;
  const chartHeight = 260;
  const paddingX = 24;
  const paddingTop = 24;
  const paddingBottom = 40;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const baselineY = chartHeight - paddingBottom;

  const points: Point[] = safeData.map((item, index) => {
    const x = safeData.length === 1 ? chartWidth / 2 : paddingX + (usableWidth / (safeData.length - 1)) * index;
    const ratio = maxValue === 0 ? 0 : item.value / maxValue;
    const y = baselineY - ratio * usableHeight;

    return { x, y };
  });

  const selectedPoint = points[activeIndex] ?? points.at(-1);
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${points.at(-1)?.x ?? chartWidth / 2} ${baselineY} L ${points[0]?.x ?? chartWidth / 2} ${baselineY} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => baselineY - usableHeight * ratio);

  return (
    <Card className="overflow-hidden border-0 bg-transparent p-0 shadow-none">
      <div className="rounded-[30px] border border-border/80 bg-white/95 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] dark:bg-slate-950/95 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h3 className="font-display text-xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          <div className="rounded-[22px] border border-primary/15 bg-primary/5 px-4 py-3 shadow-sm dark:bg-primary/10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Tanlangan kun</div>
            <div className="mt-2 font-display text-xl font-bold tracking-tight text-slate-950 dark:text-white">{formatChartLabelShort(selectedItem.label)}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatChartLabelLong(selectedItem.label)}</div>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {safeData.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "min-w-[118px] rounded-[20px] border px-3 py-3 text-left transition",
                index === activeIndex
                  ? "border-primary/30 bg-primary/5 shadow-[0_14px_28px_rgba(59,91,219,0.12)]"
                  : "border-border/80 bg-slate-50/90 hover:border-primary/20 hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-900"
              )}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {formatChartLabelWeekday(item.label)}
              </div>
              <div className="mt-2 text-base font-semibold text-slate-950 dark:text-white">{formatChartLabelShort(item.label)}</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatValue(item.value)}</div>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-[30px] border border-slate-800/90 bg-slate-950 p-4 text-white shadow-[0_24px_50px_rgba(15,23,42,0.18)] sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Dinamik hisobot</div>
                <div className="mt-1 text-sm text-slate-400">Nuqtani yoki kun kartasini bosib ko'ring</div>
              </div>
              <div className={cn("inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold", trendTone)}>
                <TrendIcon size={14} />
                {trendCopy}
              </div>
            </div>

            <div className="mt-5">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[220px] w-full">
                <defs>
                  <linearGradient id={`area-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(96,165,250,0.42)" />
                    <stop offset="100%" stopColor="rgba(15,23,42,0)" />
                  </linearGradient>
                  <linearGradient id={`line-${chartId}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>

                {gridLines.map((y) => (
                  <line
                    key={y}
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="rgba(148,163,184,0.18)"
                    strokeDasharray="4 6"
                  />
                ))}

                {selectedPoint ? (
                  <line
                    x1={selectedPoint.x}
                    y1={paddingTop}
                    x2={selectedPoint.x}
                    y2={baselineY}
                    stroke="rgba(125,211,252,0.4)"
                    strokeDasharray="6 8"
                  />
                ) : null}

                <path d={areaPath} fill={`url(#area-${chartId})`} />
                <path d={linePath} fill="none" stroke={`url(#line-${chartId})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                {selectedPoint ? (
                  <g transform={`translate(${selectedPoint.x}, ${Math.max(selectedPoint.y - 22, 34)})`}>
                    <rect x="-58" y="-36" width="116" height="28" rx="14" fill="rgba(15,23,42,0.92)" stroke="rgba(125,211,252,0.28)" />
                    <text x="0" y="-18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#f8fafc">
                      {formatChartLabelLong(selectedItem.label)}
                    </text>
                  </g>
                ) : null}

                {points.map((point, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <g
                      key={`${safeData[index]?.label}-${point.x}`}
                      onClick={() => setSelectedIndex(index)}
                      className="cursor-pointer"
                    >
                      {isActive ? <circle cx={point.x} cy={point.y} r="18" fill="rgba(125,211,252,0.16)" /> : null}
                      <circle cx={point.x} cy={point.y} r={isActive ? "10" : "8"} fill="rgba(15,23,42,0.95)" />
                      <circle cx={point.x} cy={point.y} r={isActive ? "5.5" : "4.5"} fill={isActive ? "#7dd3fc" : "#f8fafc"} />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[24px] border border-border/80 bg-slate-50/90 p-4 dark:bg-slate-900/70">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Tanlangan sana</div>
              <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{formatChartLabelLong(selectedItem.label)}</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatChartLabelMeta(selectedItem.label)}</div>
            </div>

            <div className="rounded-[24px] border border-border/80 bg-slate-50/90 p-4 dark:bg-slate-900/70">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Ko'rsatkich</div>
              <div className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{formatValue(selectedItem.value)}</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{pointDeltaCopy}</div>
            </div>

            <div className="rounded-[24px] border border-border/80 bg-slate-50/90 p-4 dark:bg-slate-900/70">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Taqqoslash</div>
              <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">O'rtacha {formatValue(average)}</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{averageCopy}</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
