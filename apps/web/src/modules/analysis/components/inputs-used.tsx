import { SectionHeader } from "@/ui/section-header";

import type { InputUsed } from "../page-props";
import { t } from "../strings";

export function InputsUsed({ inputs }: { inputs: InputUsed[] }) {
  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <SectionHeader title={t.panel.inputsUsed} />
      <dl className="divide-border border-border divide-y border-b text-[13px]">
        {inputs.map((input) => (
          <div
            key={input.key}
            className="flex flex-col gap-1 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
          >
            <dt className="text-muted-foreground">{input.label}</dt>
            <dd className="font-heading tabular-nums sm:text-right">{input.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
