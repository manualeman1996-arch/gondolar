"use client";

import { useEffect, useRef } from "react";
import { getAnonymousSessionId } from "@/lib/session";

/** Fires an anonymous product_view event once per mount. */
export function RecordView({
  storeId,
  productId,
  query,
}: {
  storeId: string;
  productId: string;
  query?: string;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch("/api/public/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId,
        productId,
        query,
        sessionId: getAnonymousSessionId(),
        eventType: "product_view",
      }),
    }).catch(() => {});
  }, [storeId, productId, query]);
  return null;
}
