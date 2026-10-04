"use client";

import { useEffect } from "react";

import { clearOfflineCopies } from "@/platform/pwa/offline-copies";

// Reaching a signed-out screen means nobody's copies belong in this browser
// any more, however the session ended: sign-out, expiry, revocation from
// another device or an account deletion (ADR-0007).
export function ClearOfflineCopies() {
  useEffect(() => {
    void clearOfflineCopies();
  }, []);
  return null;
}
