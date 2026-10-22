"use client";

import { useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import Error from "@/components/Error";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Sprite } from "@/components/pixel/sprites";
import { DeleteRecordDialog } from "@/components/shared/delete-record-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
} from "@/components/ui/sortable";
import { ListStatusTabs, RowActionsMenu, type ListStatus } from "@/components/shared/list-controls";

import {
  useArchiveCategory,
  useCategories,
  useDeleteCategory,
  useReorderCategories,
  useRestoreCategory,
  useRestoreDefaultCategories,
} from "../hooks";
import { CATEGORY_KINDS, CATEGORY_KIND_LABELS, type Category, type CategoryKind } from "../schema";
import { CategoryForm } from "./CategoryForm";
import { MergeCategoryDialog } from "./MergeCategoryDialog";

const usageLabel = (count: number | null) =>
  count ? `${count} transaction${count === 1 ? "" : "s"}` : "Not used yet";

export default function CategoriesPage() {
  const [status, setStatus] = useState<ListStatus>("active");
  const categories = useCategories(status);
  // The merge picker needs the active list even while the archived tab is open.
  const active = useCategories("active");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [merging, setMerging] = useState<Category | null>(null);
  const [confirmDefaults, setConfirmDefaults] = useState(false);

  const remove = useDeleteCategory();
  const archive = useArchiveCategory();
  const restore = useRestoreCategory();
  const reorder = useReorderCategories();
  const restoreDefaults = useRestoreDefaultCategories();

  const openForm = (category: Category | null) => {
    setEditing(category);
    setFormOpen(true);
  };

  const list = categories.data ?? [];

  /** Reorders one kind's group; the API gets every active id, groups kept in kind order. */
  const moveWithin = (kind: CategoryKind, reordered: Category[]) => {
    const ordered = CATEGORY_KINDS.flatMap((k) =>
      k === kind ? reordered : list.filter((c) => c.kind === k)
    );
    reorder.mutate(ordered, { onError: (error) => toast.error(error.message) });
  };

  const actionsFor = (category: Category) =>
    status === "active"
      ? [
          { label: "Edit", onSelect: () => openForm(category) },
          { label: "Merge into another", onSelect: () => setMerging(category) },
          {
            label: "Archive",
            onSelect: () =>
              archive.mutate(category.id, { onSuccess: (res) => toast.success(res.message) }),
          },
          { label: "Delete", onSelect: () => setDeleting(category), destructive: true },
        ]
      : [
          {
            label: "Restore",
            onSelect: () =>
              restore.mutate(category.id, { onSuccess: (res) => toast.success(res.message) }),
          },
        ];

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Categories"
        sprite="bag"
        description="What you spend on and save toward. Drag to set the order they appear in budgets and forms."
        actions={
          <>
            <Button variant="outline" onClick={() => setConfirmDefaults(true)}>
              <RotateCcw className="size-4" aria-hidden />
              Restore defaults
            </Button>
            <Button onClick={() => openForm(null)}>
              <Plus className="size-4" aria-hidden />
              Add category
            </Button>
          </>
        }
      />

      <ListStatusTabs value={status} onValueChange={setStatus} />

      {categories.isError ? (
        <Error message={categories.error.message} />
      ) : categories.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        status === "active" ? (
          <EmptyState
            sprite="bag"
            title="No categories yet"
            description="Add your own, or restore the starter categories for your region."
            action={<Button onClick={() => setConfirmDefaults(true)}>Restore defaults</Button>}
          />
        ) : (
          <EmptyState
            title="Nothing archived"
            description="Archived categories keep their history and show up here."
          />
        )
      ) : (
        <div className="space-y-8">
          {CATEGORY_KINDS.map((kind) => {
            const group = list.filter((c) => c.kind === kind);
            if (group.length === 0) return null;

            return (
              <section key={kind} aria-labelledby={`kind-${kind}`} className="space-y-2">
                <h2 id={`kind-${kind}`} className="text-lg">
                  {CATEGORY_KIND_LABELS[kind]}
                </h2>

                {status === "active" ? (
                  <Sortable
                    value={group}
                    onValueChange={(items) => moveWithin(kind, items)}
                    getItemValue={(c) => c.id}
                  >
                    <SortableContent asChild>
                      <ul className="pixel-panel divide-y p-2">
                        {group.map((category) => (
                          <SortableItem key={category.id} value={category.id} asChild>
                            <li className="hover:bg-accent/60 flex items-center gap-2 bg-card px-1 py-1.5 sm:px-3">
                              <SortableItemHandle asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground size-11 shrink-0"
                                  aria-label={`Reorder ${category.name}`}
                                >
                                  <PixelGrip />
                                </Button>
                              </SortableItemHandle>
                              <CategoryRow category={category} />
                              <RowActionsMenu
                                label={`Actions for ${category.name}`}
                                actions={actionsFor(category)}
                              />
                            </li>
                          </SortableItem>
                        ))}
                      </ul>
                    </SortableContent>
                  </Sortable>
                ) : (
                  <ul className="pixel-panel divide-y p-2">
                    {group.map((category) => (
                      <li
                        key={category.id}
                        className="flex items-center gap-2 px-3 py-2 opacity-90"
                      >
                        <CategoryRow category={category} />
                        <RowActionsMenu
                          label={`Actions for ${category.name}`}
                          actions={actionsFor(category)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <CategoryForm open={formOpen} onOpenChange={setFormOpen} category={editing} />

      <MergeCategoryDialog
        source={merging}
        categories={active.data ?? []}
        onOpenChange={(open) => !open && setMerging(null)}
      />

      {deleting && (
        <DeleteRecordDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          name={deleting.name}
          noun="category"
          onDelete={() => remove.mutateAsync(deleting.id).then((res) => toast.success(res.message))}
          onArchive={() =>
            archive.mutateAsync(deleting.id).then((res) => toast.success(res.message))
          }
          onMerge={() => setMerging(deleting)}
        />
      )}

      <ConfirmDialog
        open={confirmDefaults}
        onOpenChange={setConfirmDefaults}
        showTrigger={false}
        title="Restore default categories?"
        description="Brings back any starter category you deleted or archived. Your own categories and amounts stay as they are."
        confirmLabel="Restore defaults"
        isPending={restoreDefaults.isPending}
        onConfirm={() =>
          restoreDefaults.mutate(undefined, {
            onSuccess: (res) => {
              toast.success(res.message);
              setConfirmDefaults(false);
            },
            onError: (error) => toast.error(error.message),
          })
        }
      />
    </div>
  );
}

/** Six pixel dots: the drag handle, drawn square like everything else. */
function PixelGrip() {
  return (
    <svg data-pixel viewBox="0 0 5 8" className="h-4 w-2.5" aria-hidden>
      {[0, 3, 6].map((y) =>
        [0, 3].map((x) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={2} height={2} fill="currentColor" />
        ))
      )}
    </svg>
  );
}

function CategoryRow({ category }: { category: Category }) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
      <span className="flex min-w-0 items-center gap-2">
        {/* The category's own colour, as a square pixel swatch. */}
        <span
          aria-hidden
          className="border-outline size-3.5 shrink-0 border-2"
          style={{ backgroundColor: category.color ?? "var(--muted)" }}
        />
        <span className="font-pixel truncate">{category.name}</span>
        {category.archived_at && <span className="text-muted-foreground text-xs">(archived)</span>}
      </span>
      {category.is_essential && (
        <span className="border-outline bg-highlight text-highlight-foreground font-pixel inline-flex items-center gap-1 border-2 px-1.5 text-xs">
          <Sprite name="star" size={12} />
          Essential
        </span>
      )}
      <span className="text-muted-foreground text-xs sm:ml-auto">
        {usageLabel(category.usage_count)}
      </span>
    </div>
  );
}
