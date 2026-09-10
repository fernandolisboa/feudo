import { useState, useTransition } from "react";

import type { ActionState } from "./action-state";
import { isRedirectSignal } from "./is-redirect-signal";

// Shared by every component that calls a server action directly from a
// client event handler (bypassing useActionState/<form>): run it inside a
// transition, rethrow Next's redirect sentinel instead of swallowing it as a
// failure (isRedirectSignal), and fall back to a caller-supplied message for
// anything else that goes wrong reaching the server.
export function useActionInTransition(fallbackErrorMessage: string): {
  errorMessage: string | null;
  isPending: boolean;
  run: (action: () => Promise<ActionState>) => void;
} {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<ActionState>): void {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (result.status === "error") {
          setErrorMessage(result.message);
        }
      } catch (error) {
        if (isRedirectSignal(error)) {
          throw error;
        }
        setErrorMessage(fallbackErrorMessage);
      }
    });
  }

  return { errorMessage, isPending, run };
}
