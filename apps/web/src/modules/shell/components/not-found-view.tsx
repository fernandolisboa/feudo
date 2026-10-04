import Link from "next/link";

import { Button } from "@/ui/button";

import { t } from "../strings";

export function NotFoundView() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">{t.notFound.body}</p>
      <Button render={<Link href="/" />}>{t.notFound.action}</Button>
    </div>
  );
}
