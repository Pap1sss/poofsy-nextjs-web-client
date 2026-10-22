"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Sprite } from "@/components/pixel/sprites";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { routes } from "@/config/routes";
import { useTemplates } from "@/features/budget-template/hooks";

import { useCopyBudget, useCreateBudget } from "../hooks";
import type { PayPeriod } from "../schema";

const NO_TEMPLATE = "none";

type CreateBudgetPanelProps = {
  period: PayPeriod;
  /** The previous cutoff's budget, offered as "Copy last budget". */
  previousBudgetId?: string;
  /** Stay on this page after creating (the planner then shows the new budget in place). */
  stay?: boolean;
};

/** A cutoff without a budget: start one from a template, or copy the last one. */
export function CreateBudgetPanel({
  period,
  previousBudgetId,
  stay = false,
}: CreateBudgetPanelProps) {
  const router = useRouter();
  const templates = useTemplates();
  const create = useCreateBudget();
  const copy = useCopyBudget();
  const [templateId, setTemplateId] = React.useState<string>("");

  const defaultId = templates.data?.find((t) => t.is_default)?.id;
  const selected = templateId || defaultId || NO_TEMPLATE;

  const created = (res: { message: string; data: { id: string } }) => {
    toast.success(res.message);
    if (!stay) router.push(routes.budgets.detail(res.data.id));
  };
  const failed = (error: Error) => toast.error(error.message);

  return (
    <section aria-labelledby="create-budget-title" className="pixel-panel p-6 md:p-8">
      <Sprite name="mascot" size={40} />
      <h2 id="create-budget-title" className="mt-3 text-2xl">
        No budget for {period.label} yet
      </h2>
      <p className="text-muted-foreground mt-1 max-w-prose text-sm">
        Give this payday&apos;s money a plan before it&apos;s spent. A template fills in your usual
        amounts; you can change any of them after.
      </p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <Field className="sm:max-w-xs">
          <FieldLabel htmlFor="create-budget-template">Start from</FieldLabel>
          <Select value={selected} onValueChange={setTemplateId}>
            <SelectTrigger id="create-budget-template" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(templates.data ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                  {t.is_default ? " (default)" : ""}
                </SelectItem>
              ))}
              <SelectItem value={NO_TEMPLATE}>An empty budget</SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription>Amounts are fixed when the budget is created.</FieldDescription>
        </Field>
        <div className="flex flex-wrap gap-2 sm:pb-7">
          <Button
            disabled={create.isPending}
            onClick={() =>
              create.mutate(
                {
                  pay_period_id: period.id,
                  budget_template_id: selected === NO_TEMPLATE ? null : selected,
                },
                { onSuccess: created, onError: failed }
              )
            }
          >
            {create.isPending ? "Creating..." : "Create budget"}
          </Button>
          {previousBudgetId && (
            <Button
              variant="outline"
              disabled={copy.isPending}
              onClick={() =>
                copy.mutate(
                  { id: previousBudgetId, payPeriodId: period.id },
                  { onSuccess: created, onError: failed }
                )
              }
            >
              <Copy className="size-4" aria-hidden />
              Copy last budget
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
