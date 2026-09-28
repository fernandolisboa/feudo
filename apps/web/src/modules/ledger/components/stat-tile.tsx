export function StatTile({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta: string | null;
}) {
  return (
    <div className="bg-card flex flex-col gap-1 p-4">
      <p className="text-muted-foreground text-[12px]">{label}</p>
      <p className="font-heading text-[26px] tabular-nums">{value}</p>
      {meta ? <p className="text-muted-foreground text-[13px] tabular-nums">{meta}</p> : null}
    </div>
  );
}
