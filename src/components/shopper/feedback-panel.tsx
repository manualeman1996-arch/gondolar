"use client";

import { useState } from "react";
import { Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAnonymousSessionId } from "@/lib/session";
import { FEEDBACK_REASON_LABELS, type FeedbackReason } from "@/lib/types";

type Phase = "ask" | "reason" | "thanks_pos" | "thanks_neg";

export function FeedbackPanel({
  storeId,
  productId,
  query,
}: {
  storeId: string;
  productId: string;
  query?: string;
}) {
  const [phase, setPhase] = useState<Phase>("ask");
  const [saving, setSaving] = useState(false);

  async function send(found: boolean, reason?: FeedbackReason) {
    setSaving(true);
    try {
      await fetch("/api/public/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          productId,
          query,
          found,
          reason,
          sessionId: getAnonymousSessionId(),
        }),
      });
    } catch {
      // best-effort; don't block the UI
    } finally {
      setSaving(false);
    }
  }

  if (phase === "thanks_pos") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
        <Check className="mx-auto mb-1 h-6 w-6 text-emerald-600" />
        <p className="font-semibold text-emerald-800">
          Gracias. Tu respuesta ayuda a mejorar la tienda.
        </p>
      </div>
    );
  }

  if (phase === "thanks_neg") {
    return (
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-center">
        <p className="font-semibold text-orange-800">
          Gracias. Vamos a revisar esta ubicación.
        </p>
        <p className="mt-1 text-sm text-orange-700">
          Mientras tanto, mirá las alternativas de abajo.
        </p>
      </div>
    );
  }

  if (phase === "reason") {
    const reasons = Object.entries(FEEDBACK_REASON_LABELS) as [
      FeedbackReason,
      string,
    ][];
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-slate-700">
          ¿Qué pasó? (opcional)
        </p>
        <div className="flex flex-col gap-2">
          {reasons.map(([value, label]) => (
            <button
              key={value}
              disabled={saving}
              onClick={async () => {
                await send(false, value);
                setPhase("thanks_neg");
              }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50"
            >
              {label}
            </button>
          ))}
          <button
            disabled={saving}
            onClick={async () => {
              await send(false);
              setPhase("thanks_neg");
            }}
            className="mt-1 text-sm text-slate-400 hover:text-slate-600"
          >
            Omitir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-center text-base font-semibold text-slate-800">
        ¿Lo encontraste?
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="success"
          size="lg"
          disabled={saving}
          onClick={async () => {
            await send(true);
            setPhase("thanks_pos");
          }}
        >
          <ThumbsUp className="h-5 w-5" /> Sí, lo encontré
        </Button>
        <Button
          variant="outline"
          size="lg"
          disabled={saving}
          onClick={() => setPhase("reason")}
        >
          <ThumbsDown className="h-5 w-5" /> No lo encontré
        </Button>
      </div>
    </div>
  );
}
