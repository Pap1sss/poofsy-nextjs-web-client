"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

import Error from "@/components/Error";
import { EmptyState } from "@/components/shared/empty-state";
import { RowActionsMenu, type RowAction } from "@/components/shared/list-controls";
import { MoneyDisplay } from "@/components/shared/money-display";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { segmentClass, segmentListClass } from "@/components/ui/segments";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { isZero } from "@/lib/money";
import { formatDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/component";

import { useCompleteGroup, useGroups } from "../hooks";
import type { GroupCard, GroupFilters, GroupSummary } from "../schema";
import { DeleteGroupDialog } from "./DeleteGroupDialog";
import { GroupForm } from "./GroupForm";
import { GroupAvatar, SettleProgress, StatusBadge } from "./group-bits";

const STATUS_TABS: { value: GroupFilters["status"]; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
];

export default function GroupsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GroupFilters["status"]>("active");
  const [debounced] = useDebounce(search, 300);
  const groups = useGroups({ search: debounced, status });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<GroupCard | null>(null);
  const [deleting, setDeleting] = useState<GroupCard | null>(null);

  const filtered = debounced.trim() !== "" || status !== "active";

  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="Groups"
        sprite="bag"
        description="Split shared expenses with friends: who paid, what each person owes, and who still has to pay whom."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden />
            New group
          </Button>
        }
      />

      {groups.isError && !groups.data ? (
        <Error message={groups.error.message} />
      ) : !groups.data ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <Summary summary={groups.data.summary} />
      )}

      <div
        className="pixel-panel flex flex-wrap gap-3 p-4"
        role="search"
        aria-label="Filter groups"
      >
        <InputGroup className="min-w-0 flex-1 sm:max-w-sm">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="Search groups"
            placeholder="Search groups"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>
        <div role="group" aria-label="Status" className={segmentListClass}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={status === tab.value}
              onClick={() => setStatus(tab.value)}
              className={segmentClass}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {!groups.data ? (
        <div
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
          aria-label="Loading groups"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : groups.data.groups.length === 0 ? (
        filtered ? (
          <EmptyState
            title="No groups match"
            description="Try another search or status."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatus("active");
                }}
              >
                Show active groups
              </Button>
            }
          />
        ) : (
          <EmptyState
            sprite="bag"
            title="No groups yet"
            description="Ordered food with friends, or went on a trip together? Make a group, add who paid what, and Poofsy works out who owes whom."
            action={<Button onClick={() => setCreating(true)}>Create your first group</Button>}
          />
        )
      ) : (
        <ul
          className={cn(
            "grid gap-4 md:grid-cols-2 xl:grid-cols-3",
            groups.isFetching && "opacity-70 transition-opacity"
          )}
          aria-busy={groups.isFetching}
        >
          {groups.data.groups.map((group) => (
            <GroupTile key={group.id} group={group} onEdit={setEditing} onDelete={setDeleting} />
          ))}
        </ul>
      )}

      <GroupForm open={creating} onOpenChange={setCreating} group={null} />
      <GroupForm
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        group={editing}
      />
      <DeleteGroupDialog
        group={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onDeleted={() => toast.success("Group deleted.")}
      />
    </div>
  );
}

function Summary({ summary }: { summary: GroupSummary }) {
  return (
    <section aria-label="Groups summary" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        sprite="coin"
        label="Owed to me"
        value={<MoneyDisplay value={summary.owed_to_me} tone="income" />}
        hint="Across active groups"
        className="border-l-income border-l-8"
      />
      <StatCard
        sprite="receipt"
        label="I owe"
        value={<MoneyDisplay value={summary.i_owe} tone="expense" />}
        hint="Across active groups"
        className="border-l-expense border-l-8"
      />
      <StatCard sprite="bag" label="Active groups" value={summary.active_count} />
      <StatCard sprite="check" label="Completed" value={summary.completed_count} />
    </section>
  );
}

function GroupTile({
  group,
  onEdit,
  onDelete,
}: {
  group: GroupCard;
  onEdit: (g: GroupCard) => void;
  onDelete: (g: GroupCard) => void;
}) {
  const complete = useCompleteGroup();
  const active = group.status === "active";

  const actions: RowAction[] = [
    ...(active ? [{ label: "Edit details", onSelect: () => onEdit(group) }] : []),
    {
      label: active ? "Mark completed" : "Reopen",
      onSelect: () =>
        complete.mutate(
          { id: group.id, complete: active },
          { onSuccess: (res) => toast.success(res.message), onError: (e) => toast.error(e.message) }
        ),
    },
    { label: "Delete", onSelect: () => onDelete(group), destructive: true },
  ];

  return (
    <li className="pixel-panel relative flex flex-col gap-4 p-4">
      <div className="flex items-start gap-3">
        <GroupAvatar color={group.color} icon={group.icon} />
        <div className="min-w-0 flex-1">
          <Link
            href={routes.groups.detail(group.id)}
            className="font-pixel focus-visible:outline-highlight block truncate text-base outline-none after:absolute after:inset-0 hover:underline focus-visible:outline-3"
          >
            {group.name}
          </Link>
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {group.description || `${group.participants_count} people`}
          </p>
        </div>
        {/* Above the card-wide link, so the menu stays clickable. */}
        <div className="relative z-10">
          <RowActionsMenu label={`Actions for ${group.name}`} actions={actions} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={group.status} />
        <span className="text-muted-foreground text-xs">
          {group.participants_count} {group.participants_count === 1 ? "person" : "people"} ·{" "}
          {group.expenses_count} {group.expenses_count === 1 ? "expense" : "expenses"}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Figure label="Total spent">
          <MoneyDisplay value={group.total_expenses} tone="neutral" />
        </Figure>
        {group.my_paid && (
          <Figure label="I paid">
            <MoneyDisplay value={group.my_paid} tone="neutral" />
          </Figure>
        )}
        {group.owed_to_me && !isZero(group.owed_to_me) && (
          <Figure label="Owed to me">
            <MoneyDisplay value={group.owed_to_me} tone="income" />
          </Figure>
        )}
        {group.i_owe && !isZero(group.i_owe) && (
          <Figure label="I owe">
            <MoneyDisplay value={group.i_owe} tone="expense" />
          </Figure>
        )}
        {group.my_paid && group.is_settled && group.expenses_count > 0 && (
          <Figure label="My balance">
            <span className="text-income">All square</span>
          </Figure>
        )}
      </dl>

      <div className="mt-auto space-y-1">
        <SettleProgress percent={group.progress_percent} label={group.name} />
        <p className="text-muted-foreground text-xs">
          Updated{" "}
          {formatDateTime(group.last_activity_at ?? group.updated_at ?? group.created_at ?? "")}
        </p>
      </div>
    </li>
  );
}

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-pixel text-muted-foreground text-xs">{label}</dt>
      <dd className="font-stat text-2xl leading-none">{children}</dd>
    </div>
  );
}
