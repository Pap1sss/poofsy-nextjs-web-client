"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, TrendingUp } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Sprite } from "@/components/pixel/sprites";
import { MoneyDisplay } from "@/components/shared/money-display";
import { PageHeader } from "@/components/shared/page-header";
import TabLinks from "@/components/tab-links";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/component";

import { frequencyLabel, incomeTabLinks, sourceTypeLabel } from "../constant";
import { formatIsoDate } from "../dates";
import { useIncomeSources } from "../hooks";
import type { IncomeSource } from "../schema";
import { DeleteSourceDialog } from "./DeleteSourceDialog";
import { IncomeSourceForm } from "./IncomeSourceForm";
import { PayChangeDialog } from "./PayChangeDialog";

export default function IncomeSourcesPage() {
  const [showEnded, setShowEnded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeSource | null>(null);
  const [changing, setChanging] = useState<IncomeSource | null>(null);
  const [deleting, setDeleting] = useState<IncomeSource | null>(null);

  const sources = useIncomeSources(showEnded ? "all" : "active");

  const openForm = (source: IncomeSource | null) => {
    setEditing(source);
    setFormOpen(true);
  };

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Income"
        sprite="bag"
        description="What you expect to earn. New budgets use these amounts as their expected income."
        actions={
          <Button onClick={() => openForm(null)} className="min-h-11 sm:min-h-9">
            <Plus className="size-4" aria-hidden />
            Add income source
          </Button>
        }
      />

      <TabLinks tabLinks={incomeTabLinks} resourceId="" />

      <div className="flex items-center gap-2">
        <input
          id="show-ended"
          type="checkbox"
          className="accent-primary border-outline size-5"
          checked={showEnded}
          onChange={(e) => setShowEnded(e.target.checked)}
        />
        <Label htmlFor="show-ended" className="font-normal">
          Show ended sources and old pay amounts
        </Label>
      </div>

      {sources.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Couldn&apos;t load your income sources: {sources.error.message}
          </AlertDescription>
        </Alert>
      ) : sources.isPending ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : sources.data.length === 0 ? (
        <EmptyState
          sprite="bag"
          title="No income sources yet"
          description="Add your salary or other regular income so each new cutoff budget knows what to expect."
          action={
            <Button variant="outline" onClick={() => openForm(null)}>
              Add income source
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {sources.data.map((source) => {
            const ended = !!source.effective_to;

            return (
              <li key={source.id} className={cn("pixel-panel p-5", ended && "opacity-80")}>
                <div className="flex items-start justify-between gap-3">
                  <Sprite name="bag" size={28} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg">
                      {source.name}
                      {ended && <span className="text-muted-foreground ml-2 text-sm">(ended)</span>}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {sourceTypeLabel(source.type)},{" "}
                      {frequencyLabel(source.frequency).toLowerCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <MoneyDisplay
                      value={source.expected_net}
                      tone="neutral"
                      className="text-xl font-semibold"
                    />
                    <p className="font-pixel text-muted-foreground text-xs">take-home</p>
                  </div>
                </div>

                <p className="text-muted-foreground mt-3 text-sm">
                  Gross <MoneyDisplay value={source.expected_gross} tone="neutral" />. Since{" "}
                  {formatIsoDate(source.effective_from)}
                  {ended && <> until {formatIsoDate(source.effective_to!)}</>}.
                </p>

                {!ended && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setChanging(source)}>
                      <TrendingUp className="size-4" aria-hidden />
                      Change pay amount
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 sm:size-9"
                      aria-label={`Edit ${source.name}`}
                      onClick={() => openForm(source)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-expense size-11 sm:size-9"
                      aria-label={`Delete ${source.name}`}
                      onClick={() => setDeleting(source)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <IncomeSourceForm open={formOpen} onOpenChange={setFormOpen} source={editing} />
      <PayChangeDialog source={changing} onOpenChange={(open) => !open && setChanging(null)} />
      <DeleteSourceDialog source={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </div>
  );
}
