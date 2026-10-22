"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, LayoutTemplate, MoreHorizontal, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import Error from "@/components/Error";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Sprite } from "@/components/pixel/sprites";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";

import {
  useCreateTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
  useTemplates,
  useUpdateTemplate,
} from "../hooks";
import type { BudgetTemplate } from "../schema";

export function TemplatesList() {
  const router = useRouter();
  const templates = useTemplates();
  const create = useCreateTemplate();
  const duplicate = useDuplicateTemplate();
  const update = useUpdateTemplate();
  const remove = useDeleteTemplate();
  const [toDelete, setToDelete] = React.useState<BudgetTemplate | null>(null);

  const failed = (error: Error) => toast.error(error.message);

  const newTemplate = () =>
    create.mutate(
      { name: "New template", items: [] },
      {
        onSuccess: (res) => router.push(routes.budget_templates.detail(res.data.id)),
        onError: failed,
      }
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget templates"
        sprite="scroll"
        description="Rules that fill in each new cutoff budget. Changing a template never changes budgets already made from it."
        actions={
          <Button onClick={newTemplate} disabled={create.isPending}>
            <Plus className="size-4" aria-hidden />
            New template
          </Button>
        }
      />

      {templates.error ? (
        <Error message={templates.error.message} />
      ) : templates.isLoading ? (
        <Skeleton className="h-40" />
      ) : !templates.data?.length ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates yet"
          description="Create one with your usual amounts, and every new cutoff starts from it."
          action={<Button onClick={newTemplate}>New template</Button>}
        />
      ) : (
        <ul className="pixel-panel divide-y-2 divide-dashed px-2 py-1">
          {templates.data.map((template) => (
            <li key={template.id} className="flex min-h-16 items-center gap-3 px-2 py-3">
              <Link
                href={routes.budget_templates.detail(template.id)}
                className="menu-cursor hover:bg-accent focus-visible:outline-highlight min-w-0 flex-1 py-1 pl-5 outline-none focus-visible:outline-3"
              >
                <span className="font-pixel flex items-center gap-2 text-base">
                  <Sprite name="scroll" size={16} />
                  <span className="truncate">{template.name}</span>
                  {template.is_default && <Badge variant="secondary">Default</Badge>}
                </span>
                <span className="text-muted-foreground text-sm">
                  {template.items_count === 1 ? "1 rule" : `${template.items_count ?? 0} rules`}
                </span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    aria-label={`Actions for ${template.name}`}
                  >
                    <MoreHorizontal className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={routes.budget_templates.detail(template.id)}>
                      <Pencil className="size-4" aria-hidden />
                      Edit rules
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() =>
                      duplicate.mutate(template.id, {
                        onSuccess: (res) => toast.success(res.message),
                        onError: failed,
                      })
                    }
                  >
                    <Copy className="size-4" aria-hidden />
                    Duplicate
                  </DropdownMenuItem>
                  {!template.is_default && (
                    <DropdownMenuItem
                      onSelect={() =>
                        update.mutate(
                          { id: template.id, data: { is_default: true } },
                          {
                            onSuccess: () => toast.success(`${template.name} is now the default.`),
                            onError: failed,
                          }
                        )
                      }
                    >
                      <Star className="size-4" aria-hidden />
                      Set as default
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setToDelete(template)}>
                    <Trash2 className="size-4" aria-hidden />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        showTrigger={false}
        title={`Delete “${toDelete?.name ?? ""}”?`}
        description="Budgets made from it keep their amounts."
        confirmLabel="Delete template"
        confirmVariant="destructive"
        isPending={remove.isPending}
        onConfirm={() =>
          toDelete &&
          remove.mutate(toDelete.id, {
            onSuccess: (res) => {
              toast.success(res.message);
              setToDelete(null);
            },
            onError: failed,
          })
        }
      />
    </div>
  );
}
