"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Download, X } from "lucide-react";
import { toast } from "sonner";

import { useEcho } from "@laravel/echo-react";
import { Button } from "@/components/ui/button";
import { useAuth, PermissionGate } from "@/features/auth";
import { userPermissions } from "@/features/user/constant";
import { rolePermissions } from "@/features/role-and-permission/constant";
import { NotificationData } from "@/features/notification";
import { queryKey as userQueryKey } from "@/features/user/constant";
import { queryKey as roleQueryKey } from "@/features/role-and-permission/constant";
import { authQueryKey } from "@/features/auth/api/useAuthenticatedUser";
import { apiUrl } from "@/lib/utils/api-url";
import { routes } from "@/config/routes";

/** Every figure that moves when money does. */
const MONEY = [
  "transactions",
  "accounts",
  "budgets",
  "dashboard",
  "insights",
  "calendar",
  "reports",
];
/** The per-feature picker caches (accounts, categories, payment methods). */
const LOOKUPS = [
  "bill-lookups",
  "debt-lookups",
  "group-lookups",
  "income-lookups",
  "paylater-lookups",
  "savings-goal-lookups",
];
const PAYLATER = ["paylater", "dashboard", "budgets", "calendar", "insights"];
const DEBTS = ["debts", "debt-people"];
const GROUPS = ["groups"];

/**
 * Which caches a `user-data-updated` signal invalidates. Keys match the
 * backend's `broadcastSignalType()` (the kebab-cased model name); add an entry
 * when a new owner-scoped model starts broadcasting. Only queries on screen
 * refetch, so erring wide is cheap.
 */
const INVALIDATIONS: Record<string, string[]> = {
  auth: [authQueryKey],
  user: [userQueryKey],

  transaction: [
    ...MONEY,
    "bills",
    "bill-occurrences",
    "incomes",
    "savings-goals",
    ...DEBTS,
    "paylater",
    ...GROUPS,
  ],
  attachment: ["transactions"],
  reconciliation: ["accounts", "transactions", "dashboard"],
  account: ["accounts", "dashboard", "budgets", "savings-goals", ...LOOKUPS],
  category: [
    "categories",
    "budgets",
    "budget-templates",
    "transactions",
    "bills",
    "reports",
    ...LOOKUPS,
  ],
  "payment-method": ["payment-methods", ...LOOKUPS],
  "deduction-type": ["deduction-types", "income-lookups"],
  "income-source": ["income-sources", "incomes"],
  "income-record": ["incomes", ...MONEY],
  "income-record-deduction": ["incomes"],
  "pay-schedule": [
    "pay-schedules",
    "budgets",
    "dashboard",
    "calendar",
    "incomes",
    "income-lookups",
  ],
  "pay-period": ["budgets", "dashboard", "calendar", "incomes", "income-lookups"],
  budget: ["budgets", "dashboard", "insights", "reports"],
  "budget-allocation": ["budgets", "dashboard", "insights", "reports"],
  "budget-template": ["budget-templates"],
  "budget-template-item": ["budget-templates"],
  bill: ["bills", "bill-occurrences", "dashboard", "calendar", "insights"],
  "bill-occurrence": ["bills", "bill-occurrences", "dashboard", "calendar", "insights"],
  "savings-goal": ["savings-goals", "dashboard", "insights"],
  "savings-contribution": ["savings-goals", "dashboard", "insights"],
  person: DEBTS,
  debt: [...DEBTS, "dashboard"],
  "debt-settlement": [...DEBTS, "dashboard"],
  "debt-event": DEBTS,
  "expense-group": GROUPS,
  "group-participant": GROUPS,
  "group-expense": GROUPS,
  "group-settlement": GROUPS,
  "paylater-account": PAYLATER,
  "paylater-purchase": PAYLATER,
  "paylater-installment": PAYLATER,
  "paylater-payment": PAYLATER,
  "paylater-allocation": PAYLATER,
  "paylater-event": ["paylater"],
  "user-setting": ["settings", authQueryKey, "dashboard", "budgets", "insights"],
};

/** Admin lists, keyed by the type the server signalled on an `admin.*` channel. */
const ADMIN_INVALIDATIONS: Record<string, string[]> = {
  user: [userQueryKey],
  role: [roleQueryKey],
  permission: [roleQueryKey],
};

const SESSION_TERMINATED_MESSAGES: Record<string, string> = {
  account_deleted: "Your account was removed. You have been signed out.",
  password_reset: "Your password was reset. Sign in with your new password.",
  account_deactivated:
    "Your account was deactivated. Contact an administrator if you think this is a mistake.",
};

// Split out so the subscription can sit behind a PermissionGate; the server-side
// channel check is still the authority.
const AdminChannelListener: React.FC<{ channel: string }> = ({ channel }) => {
  const queryClient = useQueryClient();

  useEcho(
    channel,
    ".admin-data-updated",
    (payload: { type?: string }) => {
      const keys = payload?.type ? ADMIN_INVALIDATIONS[payload.type] : undefined;
      if (!keys) return;

      for (const key of keys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
    [channel]
  );

  return null;
};

const SocketListeners: React.FC = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: { data: authUser } = {} } = useAuth();

  useEcho(
    `users.${authUser?.id}`,
    ".Illuminate\\Notifications\\Events\\BroadcastNotificationCreated",
    (payload: NotificationData) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      const downloadLink = payload?.data?.download_link;
      const message = payload?.message ?? "Export file ready to download.";

      if (downloadLink) {
        toast.custom(
          (t) => (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg">
              <p className="text-sm font-medium">{message}</p>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    window.open(apiUrl(downloadLink), "_blank");
                    toast.dismiss(t);
                  }}
                >
                  <Download className="mr-1 size-4" />
                  Download
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toast.dismiss(t)}>
                  <X className="size-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>
          ),
          { duration: Infinity }
        );
      } else {
        toast.success(message);
      }
    },
    [authUser?.id]
  );

  useEcho(
    `users.${authUser?.id}`,
    ".user-data-updated",
    (payload: { types?: string[] }) => {
      // One signal covers a whole request, so the same key can come from several types.
      const keys = new Set((payload?.types ?? []).flatMap((type) => INVALIDATIONS[type] ?? []));

      for (const key of keys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
    [authUser?.id]
  );

  // The server has already revoked this user's sessions and tokens.
  useEcho(
    `users.${authUser?.id}`,
    ".user-session-terminated",
    (payload: { reason?: string }) => {
      toast.warning(
        SESSION_TERMINATED_MESSAGES[payload?.reason ?? ""] ?? "You have been signed out."
      );
      queryClient.clear();
      router.replace(routes.login);
    },
    [authUser?.id]
  );

  return (
    <>
      <PermissionGate requiredPermissions={[userPermissions.ViewAny]} requireAll returnNull>
        <AdminChannelListener channel="admin.users" />
      </PermissionGate>

      <PermissionGate requiredPermissions={[rolePermissions.ViewAny]} requireAll returnNull>
        <AdminChannelListener channel="admin.roles" />
      </PermissionGate>
    </>
  );
};

export default SocketListeners;
