export type BarListItem = {
  key: string;
  label: string;
  amountLabel: string;
  fraction: number;
};

export function BarList({ items }: { items: BarListItem[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span>{item.label}</span>
            <span className="tabular-nums">{item.amountLabel}</span>
          </div>
          <div className="bg-line-soft h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-chart-1 h-full rounded-full"
              style={{ width: `${String(Math.min(Math.max(item.fraction, 0), 1) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
