"use client";

import { Compass } from "lucide-react";

import { DropdownMenuItem } from "@/ui/dropdown-menu";

import { t } from "../strings";
import { useTour } from "./tour-provider";

export function TourMenuItem() {
  const { currentTour, startCurrentTour } = useTour();
  if (!currentTour) {
    return null;
  }
  return (
    <DropdownMenuItem onClick={startCurrentTour}>
      <Compass className="size-4" />
      {t.userMenu.tour}
    </DropdownMenuItem>
  );
}
