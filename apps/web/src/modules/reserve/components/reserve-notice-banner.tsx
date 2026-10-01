import Link from "next/link";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";

import { t } from "../strings";

export function ReserveNoticeBanner({ message }: { message: string }) {
  return (
    <Notice
      action={
        <Button variant="outline" size="sm" render={<Link href="/reserva" />}>
          {t.noticeBanner.action}
        </Button>
      }
    >
      {message}
    </Notice>
  );
}
