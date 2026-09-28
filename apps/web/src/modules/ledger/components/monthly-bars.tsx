import { interpolateAll } from "@/lib/interpolate";

import type { MonthlyBarPointView } from "../overview-page-props";
import { t } from "../strings";

const PLOT_HEIGHT = 110;
const PLOT_TOP = 24;
const SLOT_WIDTH = 100;
const BAR_WIDTH = 28;
const BAR_GAP = 4;
const GRID_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];

function barHeight(value: number, maxValue: number): number {
  if (maxValue <= 0) return 0;
  return (Math.max(value, 0) / maxValue) * PLOT_HEIGHT;
}

export function MonthlyBars({ points }: { points: MonthlyBarPointView[] }) {
  const plotBottom = PLOT_TOP + PLOT_HEIGHT;
  const width = SLOT_WIDTH * points.length;
  const maxValue = points.reduce(
    (top, point) => Math.max(top, point.incomeCentavos, point.spendingCentavos),
    0,
  );
  const accessibleName = interpolateAll(t.overview.chart.accessibleName, {
    from: points[0]?.monthLabel ?? "",
    to: points[points.length - 1]?.monthLabel ?? "",
  });

  return (
    <div>
      <div className="text-muted-foreground mb-3 flex items-center gap-4 text-[12px]">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="bg-chart-1 size-2 rounded-full" />
          {t.overview.chart.income}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="bg-chart-2 size-2 rounded-full" />
          {t.overview.chart.spending}
        </span>
      </div>
      <svg
        role="img"
        aria-label={accessibleName}
        viewBox={`0 0 ${String(width)} ${String(plotBottom + 24)}`}
        className="w-full"
      >
        {GRID_FRACTIONS.map((fraction) => {
          const y = plotBottom - fraction * PLOT_HEIGHT;
          return <line key={fraction} x1={0} x2={width} y1={y} y2={y} stroke="var(--line-soft)" />;
        })}
        {points.map((point, index) => {
          const slotX = index * SLOT_WIDTH;
          const incomeHeight = barHeight(point.incomeCentavos, maxValue);
          const spendingHeight = barHeight(point.spendingCentavos, maxValue);
          const incomeX = slotX + SLOT_WIDTH / 2 - BAR_WIDTH - BAR_GAP / 2;
          const spendingX = slotX + SLOT_WIDTH / 2 + BAR_GAP / 2;
          const isLast = index === points.length - 1;
          return (
            <g key={point.month}>
              <rect
                className="chart-bar"
                x={incomeX}
                y={plotBottom - incomeHeight}
                width={BAR_WIDTH}
                height={Math.max(incomeHeight, 1)}
                rx={4}
                fill="var(--chart-1)"
              />
              <rect
                className="chart-bar"
                x={spendingX}
                y={plotBottom - spendingHeight}
                width={BAR_WIDTH}
                height={Math.max(spendingHeight, 1)}
                rx={4}
                fill="var(--chart-2)"
              />
              {isLast ? (
                <>
                  <text
                    x={incomeX + BAR_WIDTH / 2}
                    y={plotBottom - incomeHeight - 6}
                    textAnchor="middle"
                    fontSize={11}
                    fill="var(--ink)"
                  >
                    {point.incomeCompactLabel}
                  </text>
                  <text
                    x={spendingX + BAR_WIDTH / 2}
                    y={plotBottom - spendingHeight - 6}
                    textAnchor="middle"
                    fontSize={11}
                    fill="var(--ink)"
                  >
                    {point.spendingCompactLabel}
                  </text>
                </>
              ) : null}
              <text
                x={slotX + SLOT_WIDTH / 2}
                y={plotBottom + 18}
                textAnchor="middle"
                fontSize={11}
                fill="var(--muted)"
              >
                {point.shortLabel}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{accessibleName}</caption>
        <thead>
          <tr>
            <th>{t.overview.chart.month}</th>
            <th>{t.overview.chart.income}</th>
            <th>{t.overview.chart.spending}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.month}>
              <td>{point.monthLabel}</td>
              <td>{point.incomeAmountLabel}</td>
              <td>{point.spendingAmountLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
