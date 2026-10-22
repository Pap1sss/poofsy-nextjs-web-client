"use client";

import { useState } from "react";

import { Sprite } from "@/components/pixel/sprites";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserSettings } from "@/features/auth";
import { formatIsoDate } from "@/features/income/dates";
import { todayIn } from "@/lib/utils/date";

import { usePaydayPreview, usePaySchedules } from "../hooks";
import {
  describeSchedule,
  usesAnchor,
  type PaySchedule,
  type PayScheduleFormValues,
} from "../schema";
import { PaydayList } from "./PaydayList";
import { PayScheduleForm } from "./PayScheduleForm";

/** The stored schedule as preview input, starting today. */
const asPreviewValues = (schedule: PaySchedule, today: string): PayScheduleFormValues | null =>
  ["semi_monthly", "monthly", "weekly", "biweekly"].includes(schedule.type)
    ? {
        type: schedule.type as PayScheduleFormValues["type"],
        pay_days: schedule.pay_days ?? [],
        anchor_date: usesAnchor(schedule.type) ? (schedule.anchor_date ?? "") : "",
        weekend_rule: schedule.weekend_rule,
        effective_from: today,
      }
    : null;

export default function PayScheduleSettings() {
  const { timezone } = useUserSettings();
  const [editing, setEditing] = useState(false);
  const schedules = usePaySchedules();

  const current = schedules.data?.find((s) => s.effective_to === null) ?? null;
  const preview = usePaydayPreview(current ? asPreviewValues(current, todayIn(timezone)) : null);
  const history = schedules.data?.filter((s) => s !== current) ?? [];

  return (
    <div className="page-container max-w-3xl space-y-8">
      <PageHeader
        title="Pay schedule"
        sprite="calendar"
        description="Your paydays decide how each cutoff budget is split."
        actions={
          !editing && (
            <Button onClick={() => setEditing(true)} className="min-h-11 sm:min-h-9">
              Change pay schedule
            </Button>
          )
        }
      />

      {schedules.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Couldn&apos;t load your pay schedule: {schedules.error.message}
          </AlertDescription>
        </Alert>
      ) : schedules.isPending ? (
        <Skeleton className="h-40" />
      ) : editing ? (
        <section className="pixel-panel p-6">
          <h2 className="mb-6 text-lg">New pay schedule</h2>
          <PayScheduleForm current={current} onDone={() => setEditing(false)} />
        </section>
      ) : (
        <section aria-labelledby="current-heading" className="space-y-4">
          <h2 id="current-heading" className="sr-only">
            Current schedule
          </h2>
          {/* Poof says the schedule back, in a dialogue box. */}
          <div className="flex items-end gap-3">
            <Sprite name="mascot" size={44} className="shrink-0" />
            <p className="pixel-panel max-w-prose px-5 py-4 text-lg leading-relaxed font-medium text-balance">
              {current
                ? describeSchedule(current)
                : "Your income doesn't arrive on fixed paydays, so each budget covers a calendar month."}
            </p>
          </div>
          {current && (
            <>
              <p className="text-muted-foreground text-sm">
                In effect since {formatIsoDate(current.effective_from)}. Your next six paydays:
              </p>
              <PaydayList dates={preview.data} isLoading={preview.isFetching} />
            </>
          )}
        </section>
      )}

      {history.length > 0 && (
        <section aria-labelledby="history-heading" className="space-y-3">
          <h2 id="history-heading" className="text-lg">
            Earlier schedules
          </h2>
          <ul className="pixel-box bg-card divide-y">
            {history.map((schedule) => (
              <li
                key={schedule.id}
                className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4"
              >
                <span className="font-pixel text-muted-foreground text-sm tabular-nums">
                  {formatIsoDate(schedule.effective_from)} to{" "}
                  {schedule.effective_to ? formatIsoDate(schedule.effective_to) : "now"}
                </span>
                <span className="text-sm">{describeSchedule(schedule)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
