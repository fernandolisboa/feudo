"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";
import {
  isBrowserOffline,
  isServedOfflineCopy,
  noteReconnected,
  WRITE_BLOCKED_EVENT,
} from "@/lib/offline-writes";
import {
  clearOfflineCopies,
  isOfflineCopyScreen,
  OFFLINE_COPIES_SCOPE_KEY,
  requestOfflineCopy,
} from "@/platform/pwa/offline-copies";
import { isPushOwnedBySomeoneElse, unsubscribeThisDevice } from "@/platform/pwa/push-device";

import { lastUpdatedLabel } from "../offline-freshness";
import { t } from "../strings";

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

const reconnectListeners = new Set<() => void>();

function markReconnected(): void {
  noteReconnected();
  for (const listener of reconnectListeners) {
    listener();
  }
}

function subscribeToReconnect(onChange: () => void): () => void {
  reconnectListeners.add(onChange);
  return () => {
    reconnectListeners.delete(onChange);
  };
}

// A copy served offline stays on screen when the network comes back without
// the browser noticing (it believed it was online all along); a request that
// reaches the server is the proof.
async function confirmReconnected(): Promise<boolean> {
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

// undefined when the browser refuses storage, so the check is skipped rather
// than clearing the copies on every load.
function readStoredScope(): string | null | undefined {
  try {
    return window.localStorage.getItem(OFFLINE_COPIES_SCOPE_KEY);
  } catch {
    return undefined;
  }
}

function storeScope(scope: string): void {
  try {
    window.localStorage.setItem(OFFLINE_COPIES_SCOPE_KEY, scope);
  } catch {
    // Sign-out and the household switch still clear the copies themselves.
  }
}

export function OfflineNotice({
  renderedAt,
  timeZone,
  scope,
  userId,
}: {
  renderedAt: string;
  timeZone: string;
  scope: string;
  userId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const online = useSyncExternalStore(
    subscribeToConnectivity,
    () => navigator.onLine,
    () => true,
  );
  const servedOfflineCopy = useSyncExternalStore(
    subscribeToReconnect,
    isServedOfflineCopy,
    () => false,
  );
  const offline = !online || servedOfflineCopy;
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

  // Notifications follow the person who turned them on, not the household
  // (ADR-0012): someone else signing in on this browser stops them, however
  // the earlier session ended.
  useEffect(() => {
    if (isPushOwnedBySomeoneElse(userId)) {
      void unsubscribeThisDevice().catch(() => null);
    }
  }, [userId]);

  useEffect(() => {
    if (isFirstLocation.current) {
      isFirstLocation.current = false;
      return;
    }
    function keepCopy(): void {
      recordNavigationData(Date.now());
      if (isOfflineCopyScreen(pathname)) {
        requestOfflineCopy(window.location.href);
      }
    }
    if (!navigator.onLine) {
      return;
    }
    if (!isServedOfflineCopy()) {
      keepCopy();
      return;
    }
    void confirmReconnected().then((reachable) => {
      if (reachable) {
        markReconnected();
        keepCopy();
      }
    });
  }, [pathname, search]);

  useEffect(() => {
    function blockSubmitWhenOffline(event: SubmitEvent): void {
      const isReadForm =
        event.target instanceof HTMLFormElement && event.target.hasAttribute("data-offline-read");
      if (!isBrowserOffline() || isReadForm) {
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
      markReconnected();
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

  if (!offline && !showingCopy) {
    return null;
  }

  const lastUpdated = lastUpdatedLabel(new Date(lastUpdatedAt), new Date(), timeZone);

  return (
    <div data-offline-notice={offline ? "offline" : "copy"}>
      <Notice
        action={
          offline ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.reload();
              }}
            >
              {t.offline.retry}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                router.refresh();
              }}
            >
              {t.offline.refresh}
            </Button>
          )
        }
      >
        {offline ? t.offline.unavailable : t.offline.copy} {lastUpdated}
        {writeBlocked && offline ? (
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
