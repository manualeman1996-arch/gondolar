"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StoreQR({ url, fileName }: { url: string; fileName: string }) {
  const [png, setPng] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, { width: 480, margin: 2, errorCorrectionLevel: "M" })
      .then(setPng)
      .catch(() => setPng(""));
  }, [url]);

  function download(dataUrl: string, ext: string) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${fileName}.${ext}`;
    a.click();
  }

  async function downloadSvg() {
    const svg = await QRCode.toString(url, { type: "svg", margin: 2 });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const dataUrl = URL.createObjectURL(blob);
    download(dataUrl, "svg");
    URL.revokeObjectURL(dataUrl);
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="flex h-44 w-44 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2">
        {png ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={png} alt="QR de la sucursal" className="h-full w-full" />
        ) : (
          <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
        )}
      </div>
      <div className="w-full min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          URL pública
        </p>
        <div className="mt-1 flex items-center gap-2">
          <code className="block flex-1 truncate rounded-lg bg-slate-100 px-2 py-1.5 text-sm text-slate-700">
            {url}
          </code>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={copyUrl}>
            <Copy className="h-4 w-4" /> {copied ? "Copiado" : "Copiar"}
          </Button>
          <a href={url} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline">
              <ExternalLink className="h-4 w-4" /> Abrir
            </Button>
          </a>
          <Button size="sm" onClick={() => png && download(png, "png")} disabled={!png}>
            <Download className="h-4 w-4" /> PNG
          </Button>
          <Button size="sm" variant="secondary" onClick={downloadSvg}>
            <Download className="h-4 w-4" /> SVG
          </Button>
        </div>
      </div>
    </div>
  );
}
