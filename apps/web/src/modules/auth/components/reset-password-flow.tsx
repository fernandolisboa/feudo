"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

import { resolveResetPasswordFlowState } from "../reset-password-flow-state";
import { t } from "../strings";
import { ResetPasswordForm } from "./reset-password-form";

const IN_PROGRESS_STORAGE_KEY = "feudo:reset-password-in-progress";

function markInProgress(): void {
  try {
    window.sessionStorage.setItem(IN_PROGRESS_STORAGE_KEY, "true");
  } catch {
    // sessionStorage can be unavailable (private browsing, disabled storage);
    // a reload in that case just falls back to "invalid", same as before
    // this ticket.
  }
}

function clearInProgress(): void {
  try {
    window.sessionStorage.removeItem(IN_PROGRESS_STORAGE_KEY);
  } catch {
    // Same unavailable-storage case as markInProgress; nothing to clear.
  }
}

function readWasInProgress(): boolean {
  try {
    return window.sessionStorage.getItem(IN_PROGRESS_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function subscribeToNothing(): () => void {
  return () => {};
}

function wasInProgressOnServer(): boolean {
  return false;
}

export function ResetPasswordFlow({ token }: { token?: string }) {
  // sessionStorage doesn't exist during SSR, so the server (and the first
  // client render, before hydration) always sees `wasInProgressOnServer` —
  // matching what the page rendered — and only the post-hydration client
  // render picks up the real value, the same "flash to the real value once
  // mounted" every browser-only read implies.
  const wasInProgress = useSyncExternalStore(
    subscribeToNothing,
    readWasInProgress,
    wasInProgressOnServer,
  );

  useEffect(() => {
    if (!token) {
      return;
    }
    markInProgress();
    // A successful submit navigates away from this page (to /entrar); this
    // unmount is the client's only signal for "the reset finished", so the
    // flag is cleared here rather than lingering for a later, unrelated
    // visit to this page in the same tab.
    return () => {
      clearInProgress();
    };
  }, [token]);

  const state = resolveResetPasswordFlowState(token, wasInProgress);

  useEffect(() => {
    if (state === "link-removed") {
      clearInProgress();
    }
  }, [state]);

  if (state === "form" && token) {
    return <ResetPasswordForm token={token} />;
  }

  const message =
    state === "link-removed" ? t.resetPassword.linkRemoved : t.resetPassword.invalidOrExpired;

  return (
    <>
      <p className="text-sm" aria-live="polite">
        {message}
      </p>
      <p className="mt-4 text-sm">
        <Link
          href="/esqueci-a-senha"
          className="text-brand hover:text-brand-hover underline underline-offset-4"
        >
          {t.resetPassword.requestNewLink}
        </Link>
      </p>
    </>
  );
}
