import { useState } from "react";

import type { ActionState } from "./action-state";

// Shared by every dialog whose confirm button submits a useActionState-backed
// <form>: a successful submit should close the dialog so the updated list
// behind it is the confirmation, not a message painted inside a dialog that
// revalidatePath is about to remount anyway. Comparing against the previous
// render's state (not a status check alone) makes this run exactly once per
// new state, the same way a useEffect keyed on state would, without the
// extra render a useEffect costs here.
export function useCloseOnSuccess(state: ActionState, onOpenChange: (open: boolean) => void): void {
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.status === "success") {
      onOpenChange(false);
    }
  }
}
