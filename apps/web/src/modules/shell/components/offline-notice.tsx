"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";
import { isBrowserOffline, WRITE_BLOCKED_EVENT } from "@/lib/offline-writes";
import {
  clearOfflineCopies,
  isOfflineCopyScreen,
  requestOfflineCopy,
} from "@/platform/pwa/offline-copies";

import { lastUpdatedLabel } from "../offline-freshness";
import { t } from "../strings";

const SCOPE_STORAGE_KEY = "feudo.offline-copies.scope";

// A page the server rendered this long before the document started loading
// can only have come from the offline copies. The margin absorbs a client
// clock that runs somewhat ahead of the server's.
const COPY_AGE_THRESHOLD_MS = 10 * 60 * 1000;

function subscribeToConnectivity(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

// The newest moment the screen got data from the server through an in-app
// navigation; the layout's own render time only changes on a full load or a
// refresh.
let lastNavigationDataAt: number | null = null;
const navigationListeners = new Set<() => void>();

function recordNavigationData(at: number): void {
  lastNavigationDataAt = at;
  for (const listener of navigationListeners) {
    listener();
  }
}

function subscribeToNavigationData(onChange: () => void): () => void {
  navigationListeners.add(onChange);
  return () => {
    navigationListeners.delete(onChange);
  };
}

// undefined when the browser refuses storage, so the check is skipped rather
// than clearing the copies on every load.
function readStoredScope(): string | null | undefined {
  try {
    return window.localStorage.getItem(SCOPE_STORAGE_KEY);
  } catch {
    return undefined;
  }
}

function storeScope(scope: string): void {
  try {
    window.localStorage.setItem(SCOPE_STORAGE_KEY, scope);
  } catch {
    // Sign-out and the household switch still clear the copies themselves.
  }
}

export function OfflineNotice({
  renderedAt,
  timeZone,
  scope,
}: {
  renderedAt: string;
  timeZone: string;
  scope: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const online = useSyncExternalStore(
    subscribeToConnectivity,
    () => navigator.onLine,
    () => true,
  );
  const documentStartedAt = useSyncExternalStore(
    noopSubscribe,
    () => performance.timeOrigin,
    () => null,
  );
  const navigationDataAt = useSyncExternalStore(
    subscribeToNavigationData,
    () => lastNavigationDataAt,
    () => null,
  );
  const [writeBlocked, setWriteBlocked] = useState(false);
  const isFirstLocation = useRef(true);

  const renderedAtMs = Date.parse(renderedAt);
  // A successful in-app navigation proves the network is back.
  const showingCopy =
    navigationDataAt === null &&
    documentStartedAt !== null &&
    renderedAtMs < documentStartedAt - COPY_AGE_THRESHOLD_MS;
  const lastUpdatedAt = Math.max(renderedAtMs, navigationDataAt ?? 0);

  // Copies are scoped to one person in one household (ADR-0007). Sign-out
  // and the household switch clear them before they happen; this catches
  // every other way the scope can change (session expiry, removal from a
  // household, another person signing in on this browser).
  useEffect(() => {
    const storedScope = readStoredScope();
    if (storedScope === undefined || storedScope === scope) {
      return;
    }
    void clearOfflineCopies().then(() => {
      storeScope(scope);
      if (isOfflineCopyScreen(window.location.pathname)) {
        requestOfflineCopy(window.location.href);
      }
    });
  }, [scope]);

  useEffect(() => {
    if (isFirstLocation.current) {
      isFirstLocation.current = false;
      return;
    }
    if (isBrowserOffline()) {
      return;
    }
    recordNavigationData(Date.now());
    if (isOfflineCopyScreen(pathname)) {
      requestOfflineCopy(window.location.href);
    }
  }, [pathname, search]);

  useEffect(() => {
    function blockSubmitWhenOffline(event: SubmitEvent): void {
      if (!isBrowserOffline()) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      setWriteBlocked(true);
    }
    function showWriteBlocked(): void {
      setWriteBlocked(true);
    }
    function clearWriteBlocked(): void {
      setWriteBlocked(false);
    }
    // Capture on window runs before React's own listeners, so an
    // action-backed form never starts its server action offline.
    window.addEventListener("submit", blockSubmitWhenOffline, { capture: true });
    window.addEventListener(WRITE_BLOCKED_EVENT, showWriteBlocked);
    window.addEventListener("online", clearWriteBlocked);
    return () => {
      window.removeEventListener("submit", blockSubmitWhenOffline, { capture: true });
      window.removeEventListener(WRITE_BLOCKED_EVENT, showWriteBlocked);
      window.removeEventListener("online", clearWriteBlocked);
    };
  }, []);

  if (online && !showingCopy) {
    return null;
  }

  const lastUpdated = lastUpdatedLabel(new Date(lastUpdatedAt), new Date(), timeZone);

  return (
    <div data-offline-notice={online ? "copy" : "offline"}>
      <Notice
        action={
          online ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                router.refresh();
              }}
            >
              {t.offline.refresh}
            </Button>
          ) : null
        }
      >
        {online ? t.offline.copy : t.offline.offline} {lastUpdated}
        {writeBlocked && !online ? (
          <strong role="alert" className="mt-1 block font-semibold">
            {t.offline.writeBlocked}
          </strong>
        ) : null}
      </Notice>
    </div>
  );
}

function noopSubscribe(): () => void {
  return () => undefined;
}
