"use client";

import * as React from "react";
import { Download, FileSpreadsheet, Loader, Upload, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/component";

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

interface ImportDialogProps {
  /** e.g. "users", used in the title and copy. */
  resourceName: string;
  /** Uploads the file; resolve with the API message to toast. */
  onImport: (file: File) => Promise<{ message?: string }>;
  /** Downloads the blank template. Omit to hide the template card. */
  onDownloadTemplate?: () => Promise<void>;
  templateHint?: string;
  /** Must match the API's `mimes` rule. */
  accept?: string[];
  maxSizeMb?: number;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

export function ImportDialog({
  resourceName,
  onImport,
  onDownloadTemplate,
  templateHint = "Fill in the template, keeping the header row, then upload it here.",
  accept = [".xlsx", ".ods", ".csv"],
  maxSizeMb = 10,
  disabled = false,
  trigger,
}: ImportDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setError(null);
    setDragging(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const pick = (candidate: File | undefined | null) => {
    if (!candidate) return;

    const extension = `.${candidate.name.split(".").pop()?.toLowerCase()}`;
    if (!accept.includes(extension)) {
      setFile(null);
      setError(`Unsupported file type. Use ${accept.join(", ")}.`);
      return;
    }
    if (candidate.size > maxSizeMb * 1024 * 1024) {
      setFile(null);
      setError(`File is larger than ${maxSizeMb} MB.`);
      return;
    }

    setError(null);
    setFile(candidate);
  };

  const handleTemplate = async () => {
    if (!onDownloadTemplate) return;
    setDownloading(true);
    try {
      await onDownloadTemplate();
    } catch {
      toast.error("Could not download the template.");
    } finally {
      setDownloading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const { message } = await onImport(file);
      toast.success(message ?? "Import queued. You will be notified when it finishes.");
      reset();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (importing) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" disabled={disabled}>
            <Upload className="mr-2 size-4" />
            Import
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import {resourceName}</DialogTitle>
          <DialogDescription>
            Upload a spreadsheet to add {resourceName} in bulk.
            {onDownloadTemplate && " Use the template below."}
          </DialogDescription>
        </DialogHeader>

        {onDownloadTemplate && (
          <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileSpreadsheet className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Import template</p>
              <p className="text-xs text-muted-foreground">{templateHint}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTemplate}
              disabled={downloading}
            >
              {downloading ? (
                <Loader className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Template
            </Button>
          </div>
        )}

        {file ? (
          <div className="flex items-center gap-3 rounded-xl border p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={reset}
              disabled={importing}
              aria-label="Remove file"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              dragging && "border-primary bg-primary/5",
              error && "border-destructive/50"
            )}
          >
            <UploadCloud className="size-7 text-muted-foreground" />
            <span className="text-sm font-medium">Drop a file here or click to choose</span>
            <span className="text-xs text-muted-foreground">
              Accepted: {accept.join(", ")} · Max {maxSizeMb} MB
            </span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept.join(",")}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              reset();
            }}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleImport} disabled={!file || importing}>
            {importing ? <Loader className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
