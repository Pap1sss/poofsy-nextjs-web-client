import { z } from "zod";
import {
  ArrowLeftRight,
  Banknote,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChartColumn,
  CreditCard,
  HandCoins,
  History,
  House,
  LayoutTemplate,
  PiggyBank,
  Receipt,
  ReceiptText,
  Settings,
  Shield,
  ShoppingBag,
  Tags,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// Constant files, not feature barrels: a barrel pulls in components that import this file (a cycle).
import { rolePermissions } from "@/features/role-and-permission/constant";
import { systemActivityPermissions } from "@/features/system-activity/constant";
import { userPermissions } from "@/features/user/permissions";

export const NAV_GROUP = z.enum([
  "Dashboard",
  "Budget",
  "Setup",
  "Help",
  "Modules",
  "Management",
  "Administration",
]);

export type NavItem = {
  title: string;
  url?: string;
  icon?: LucideIcon;
  description?: string;
  permissions?: string[];
  /** Budgeting pages need a currency and pay schedule, so they're hidden until onboarding is done. */
  requiresOnboarding?: boolean;
  group: z.infer<typeof NAV_GROUP>;
  items?: {
    title: string;
    url?: string;
    permissions?: string[];
  }[];
};

export const routes = {
  empty: "",
  self: "#",

  home: "/",

  default_login_redirect: "/dashboard",
  login: "/login",
  register: "/register",
  onboarding: "/onboarding",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  dashboard: {
    home: "/dashboard",
  },
  notifications: {
    list: "/notifications",
  },
  profile: "/profile",

  budgets: {
    home: "/budgets",
    detail: (id: string | number) => `/budgets/${id}`,
  },
  transactions: "/transactions",
  income: {
    home: "/income",
    sources: "/income/sources",
  },
  accounts: "/accounts",
  categories: "/categories",
  budget_templates: {
    home: "/budget-templates",
    detail: (id: string | number) => `/budget-templates/${id}`,
  },
  savings_goals: "/savings-goals",
  bills: "/bills",
  debts: {
    home: "/debts",
    detail: (id: string | number) => `/debts/${id}`,
    person: (id: string | number) => `/debts/people/${id}`,
  },
  groups: {
    home: "/groups",
    detail: (id: string | number) => `/groups/${id}`,
  },
  paylater: {
    home: "/paylater",
    purchase: (id: string | number) => `/paylater/purchases/${id}`,
    provider: (id: string | number) => `/paylater/providers/${id}`,
  },
  reports: "/reports",
  calendar: "/calendar",
  help: "/help",
  settings: {
    home: "/settings",
    pay_schedule: "/settings/pay-schedule",
    payment_methods: "/settings/payment-methods",
    deduction_types: "/settings/deduction-types",
  },

  users: {
    home: "/users",
    create: "/users/create",
    detail: (id: string | number) => `/users/${id}`,
    details: (id: string | number) => `/users/${id}/details`,
  },
  system_activities: {
    list: "/system-activities",
  },
  roles_and_permissions: {
    list: "/roles-and-permissions",
    create: "/roles-and-permissions/create",
    detail: (id: string | number) => `/roles-and-permissions/${id}`,
    details: (id: string | number) => `/roles-and-permissions/${id}/details`,
  },
} as const;

export type Route = string | ((param: string | number) => string);

// Domain modules go in the "Modules" group; `permissions` lists any one of the
// permissions that unlocks the entry (empty = every signed-in user).
export const navigation: NavItem[] = [
  {
    title: "Home",
    url: routes.dashboard.home,
    icon: House,
    permissions: [],
    group: "Dashboard",
  },
  {
    title: "Payday Planner",
    url: routes.budgets.home,
    icon: CalendarRange,
    description: "Plan where each payday's money goes.",
    permissions: [],
    requiresOnboarding: true,
    group: "Budget",
  },
  {
    title: "Transactions",
    url: routes.transactions,
    icon: ArrowLeftRight,
    description: "Every expense, income, transfer and adjustment.",
    permissions: [],
    requiresOnboarding: true,
    group: "Budget",
  },
  {
    title: "Income",
    url: routes.income.home,
    icon: Banknote,
    description: "Payslips, deductions and expected pay.",
    permissions: [],
    requiresOnboarding: true,
    group: "Budget",
  },
  {
    title: "Accounts & Wallets",
    url: routes.accounts,
    icon: Wallet,
    description: "Balances for cash, banks and e-wallets.",
    permissions: [],
    requiresOnboarding: true,
    group: "Budget",
  },
  {
    title: "Savings Goals",
    url: routes.savings_goals,
    icon: PiggyBank,
    description: "Goals and your emergency fund.",
    permissions: [],
    requiresOnboarding: true,
    group: "Budget",
  },
  {
    title: "Bills",
    url: routes.bills,
    icon: Receipt,
    description: "Recurring bills, due dates and payments.",
    permissions: [],
    requiresOnboarding: true,
    group: "Budget",
  },
  {
    title: "Debts",
    url: routes.debts.home,
    icon: HandCoins,
    description: "Money owed to you and money you owe.",
    permissions: [],
    requiresOnboarding: true,
    group: "Budget",
  },
  {
    title: "Groups",
    url: routes.groups.home,
    icon: UsersRound,
    description: "Shared expenses split with friends, and who owes whom.",
    permissions: [],
    requiresOnboarding: true,
    group: "Budget",
  },
  {
    title: "PayLater",
    url: routes.paylater.home,
    icon: ShoppingBag,
    description: "SPayLater, TikTok PayLater and other installment plans.",
    permissions: [],
    requiresOnboarding: true,
    group: "Budget",
  },
  {
    title: "Calendar",
    url: routes.calendar,
    icon: CalendarDays,
    description: "Paydays, bills and spending by day.",
    permissions: [],
    requiresOnboarding: true,
    group: "Budget",
  },
  {
    title: "Reports",
    url: routes.reports,
    icon: ChartColumn,
    description: "Cash flow, spending and savings over time.",
    permissions: [],
    requiresOnboarding: true,
    group: "Budget",
  },
  {
    title: "Categories",
    url: routes.categories,
    icon: Tags,
    description: "What you spend and save on.",
    permissions: [],
    requiresOnboarding: true,
    group: "Setup",
  },
  {
    title: "Budget Templates",
    url: routes.budget_templates.home,
    icon: LayoutTemplate,
    description: "Rules that fill in each new cutoff budget.",
    permissions: [],
    requiresOnboarding: true,
    group: "Setup",
  },
  {
    title: "Pay Schedule",
    url: routes.settings.pay_schedule,
    icon: CalendarClock,
    description: "When you get paid, and how cutoffs are split.",
    permissions: [],
    requiresOnboarding: true,
    group: "Setup",
  },
  {
    title: "Payment Methods",
    url: routes.settings.payment_methods,
    icon: CreditCard,
    description: "Cash, GCash, cards and other ways you pay.",
    permissions: [],
    requiresOnboarding: true,
    group: "Setup",
  },
  {
    title: "Settings",
    url: routes.settings.home,
    icon: Settings,
    description: "Time zone, date format, alerts and defaults.",
    permissions: [],
    requiresOnboarding: true,
    group: "Setup",
  },
  {
    title: "Deduction Types",
    url: routes.settings.deduction_types,
    icon: ReceiptText,
    description: "Payroll deductions like SSS and PhilHealth.",
    permissions: [],
    requiresOnboarding: true,
    group: "Setup",
  },
  {
    title: "How It Works",
    url: routes.help,
    icon: BookOpen,
    description: "The built-in guide to every page and figure.",
    permissions: [],
    requiresOnboarding: true,
    group: "Help",
  },
  {
    title: "Users",
    url: routes.users.home,
    icon: Users,
    description: "Create accounts, assign roles and manage access.",
    permissions: [userPermissions.ViewAny],
    group: "Management",
  },
  {
    title: "System Activities",
    url: routes.system_activities.list,
    icon: History,
    description: "Audit trail of every change made in the system.",
    permissions: [systemActivityPermissions.ViewAny],
    group: "Administration",
  },
  {
    title: "Roles and Permissions",
    url: routes.roles_and_permissions.list,
    icon: Shield,
    description: "Define roles and what each one is allowed to do.",
    permissions: [rolePermissions.ViewAny],
    group: "Administration",
  },
];
