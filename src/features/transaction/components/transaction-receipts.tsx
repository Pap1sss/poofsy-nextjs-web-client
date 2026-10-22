"use client";

import { useRef, useState } from "react";
import { FileText, ImageIcon, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { RECEIPT_ACCEPT, RECEIPT_MAX_BYTES } from "../constant";
import { useDeleteReceipt, useReceipts, useUploadReceipt } from "../hooks";

const sizeLabel = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

/** Receipts on one transaction: stored privately, opened through short-lived links. */
export function TransactionReceipts({ transactionId }: { transactionId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const receipts = useReceipts(transactionId);
  const upload = useUploadReceipt(transactionId);
  const remove = useDeleteReceipt();

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError(null);

    if (!file) return;

    if (file.size > RECEIPT_MAX_BYTES) {
      setError("Receipts can be up to 5 MB. Try a smaller photo or a PDF.");
      return;
    }

    upload.mutate(file, {
      onSuccess: (res) => toast.success(res.message),
      onError: (e) => setError(e.message),
    });
  };

  return (
    <section aria-labelledby="receipts-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 id="receipts-heading" className="text-sm font-medium">
            Receipts
          </h3>
          <p className="text-muted-foreground text-xs">Photos or PDFs, up to 5 MB each.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={upload.isPending}
          onClick={() => input.current?.click()}
        >
          <Paperclip aria-hidden />
          {upload.isPending ? "Uploading..." : "Attach receipt"}
        </Button>
        <input
          ref={input}
          type="file"
          accept={RECEIPT_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={onPick}
        />
      </div>

      {error && (
        <p role="alert" className="text-expense text-sm">
          {error}
        </p>
      )}

      {receipts.isLoading ? (
        <Skeleton className="h-11 w-full" />
      ) : receipts.isError ? (
        <p role="alert" className="text-expense text-sm">
          Couldn&apos;t load receipts: {receipts.error.message}
        </p>
      ) : receipts.data?.length ? (
        <ul className="divide-y rounded-lg border">
          {receipts.data.map((receipt) => {
            const Icon = receipt.mime.startsWith("image/") ? ImageIcon : FileText;
            return (
              <li key={receipt.id} className="flex min-h-11 items-center gap-3 px-3 py-2 text-sm">
                <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <a
                  href={receipt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate hover:underline focus-visible:underline"
                >
                  {receipt.original_name}
                </a>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {sizeLabel(receipt.size)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${receipt.original_name}`}
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate(receipt.id, {
                      onSuccess: () => toast.success("Receipt removed."),
                      onError: (e) => setError(e.message),
                    })
                  }
                >
                  <Trash2 aria-hidden />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">No receipts attached yet.</p>
      )}
    </section>
  );
}
