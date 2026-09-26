"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { KINDS, type ProductCategoryId } from "@feudo/core";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { initialActionState } from "@/lib/action-state";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";

import { addSubcategoryAction } from "../actions";
import { t } from "../strings";
import { SUBCATEGORY_NAME_MAX_LENGTH } from "../validation";

const kindItems = KINDS.map((kind) => ({ value: kind, label: t.kinds[kind] }));

export function AddSubcategoryDialog({
  categories,
}: {
  categories: { categoryId: ProductCategoryId; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(addSubcategoryAction, initialActionState);
  const categoryItems = categories.map((category) => ({
    value: category.categoryId,
    label: category.label,
  }));

  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <Plus className="size-4" />
        {t.categoriesPage.addAction}
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t.categoriesPage.addDialog.title}</DialogTitle>
            <DialogDescription>{t.categoriesPage.addDialog.description}</DialogDescription>
          </DialogHeader>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-subcategory-category">{t.categoriesPage.addDialog.category}</Label>
            <Select name="categoryId" items={categoryItems} defaultValue={categoryItems[0]?.value}>
              <SelectTrigger id="add-subcategory-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-subcategory-name">{t.categoriesPage.addDialog.name}</Label>
            <Input
              id="add-subcategory-name"
              name="name"
              required
              maxLength={SUBCATEGORY_NAME_MAX_LENGTH}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-subcategory-kind">{t.categoriesPage.addDialog.kind}</Label>
            <Select name="kind" items={kindItems} defaultValue="variable">
              <SelectTrigger id="add-subcategory-kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {kindItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              {t.categoriesPage.addDialog.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t.categoriesPage.addDialog.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
