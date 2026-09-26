import { Badge } from "@/ui/badge";
import { PageHeader } from "@/ui/page-header";
import { SectionHeader } from "@/ui/section-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { interpolate } from "@/lib/interpolate";

import { changeSubcategoryKindAction, removeRuleAction } from "../actions";
import type { CategoriesPageProps } from "../categories-page-props";
import { t } from "../strings";
import { AddSubcategoryDialog } from "./add-subcategory-dialog";
import { FormActionButton } from "./form-action-button";
import { KindSelect } from "./kind-select";

const HEAD_CLASS = "text-muted-foreground text-[11px] tracking-wide uppercase";

export function CategoriesView({ categories, rules, suggestions }: CategoriesPageProps) {
  return (
    <>
      <PageHeader overline={t.categoriesPage.overline} title={t.categoriesPage.title} />

      {suggestions.length > 0 ? (
        <section className="mb-8">
          <SectionHeader title={t.categoriesPage.suggestions.title} />
          <p className="text-muted-foreground mb-3 max-w-prose text-[13px]">
            {t.categoriesPage.suggestions.description}
          </p>
          <ul className="divide-line-soft divide-y">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.subcategoryValue}
                className="flex min-h-[var(--density-row)] items-center justify-between gap-3"
              >
                <span>
                  {interpolate(
                    interpolate(
                      t.categoriesPage.suggestions.item,
                      "{subcategory}",
                      suggestion.subcategoryLabel,
                    ),
                    "{description}",
                    suggestion.description,
                  )}
                </span>
                <FormActionButton
                  action={changeSubcategoryKindAction}
                  fields={{ subcategory: suggestion.subcategoryValue, kind: "fixed" }}
                  label={t.categoriesPage.suggestions.action}
                  ariaLabel={interpolate(
                    t.categoriesPage.suggestions.actionFor,
                    "{subcategory}",
                    suggestion.subcategoryLabel,
                  )}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-8">
        <SectionHeader title={t.categoriesPage.rulesTitle} />
        {rules.length === 0 ? (
          <p className="text-muted-foreground text-[13px]">{t.categoriesPage.rulesEmpty}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={HEAD_CLASS}>{t.categoriesPage.ruleTable.pattern}</TableHead>
                <TableHead className={HEAD_CLASS}>{t.categoriesPage.ruleTable.direction}</TableHead>
                <TableHead className={HEAD_CLASS}>{t.categoriesPage.ruleTable.target}</TableHead>
                <TableHead>
                  <span className="sr-only">{t.categoriesPage.removeRule}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id} className="h-[var(--density-row)]">
                  <TableCell className="font-mono text-[13px]">{rule.pattern}</TableCell>
                  <TableCell className="text-muted-foreground">{rule.appliesTo}</TableCell>
                  <TableCell>{rule.target}</TableCell>
                  <TableCell className="text-right">
                    <FormActionButton
                      action={removeRuleAction}
                      fields={{ ruleId: rule.id }}
                      label={t.categoriesPage.removeRule}
                      ariaLabel={interpolate(
                        t.categoriesPage.removeRuleFor,
                        "{pattern}",
                        rule.pattern,
                      )}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section>
        <SectionHeader
          title={t.categoriesPage.subcategoriesTitle}
          actions={
            <AddSubcategoryDialog
              categories={categories.map(({ categoryId, label }) => ({ categoryId, label }))}
            />
          }
        />
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
          {categories.map((category) => (
            <div key={category.categoryId}>
              <h3 className="font-heading border-line-soft border-b pb-1 text-[15px]">
                {category.label}
              </h3>
              <ul className="divide-line-soft divide-y">
                {category.subcategories.map((subcategory) => (
                  <li
                    key={subcategory.value}
                    className="flex min-h-[var(--density-row)] items-center justify-between gap-3"
                  >
                    <span className="flex items-center gap-2">
                      {subcategory.label}
                      {subcategory.defaultKind === null ? (
                        <Badge variant="outline">{t.categoriesPage.householdBadge}</Badge>
                      ) : null}
                    </span>
                    <KindSelect
                      subcategoryValue={subcategory.value}
                      subcategoryLabel={subcategory.label}
                      kind={subcategory.kind}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
