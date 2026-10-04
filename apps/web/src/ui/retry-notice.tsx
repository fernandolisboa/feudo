import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";

export function RetryNotice({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <Notice
      tone="danger"
      action={
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      }
    >
      {message}
    </Notice>
  );
}
