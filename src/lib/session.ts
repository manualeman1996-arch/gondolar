"use client";

const KEY = "shelfsearch_sid";

/**
 * Returns a random, non-identifiable anonymous session id, stored in
 * localStorage. No PII — used only to group a shopper's events within a visit.
 */
export function getAnonymousSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = window.localStorage.getItem(KEY);
  if (!sid) {
    sid =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sid_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem(KEY, sid);
  }
  return sid;
}
