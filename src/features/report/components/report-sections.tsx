"use client";

import type { DateRange } from "@/components/shared/date-range-picker";

import { AccountBalancesReport } from "./account-balances-report";
import { BudgetPerformanceReport } from "./budget-performance-report";
import { CashFlowReport } from "./cash-flow-report";
import { CategorySpendingReport } from "./category-spending-report";
import { CutoffComparisonReport } from "./cutoff-comparison-report";
import { ExpensesReport } from "./expenses-report";
import { IncomeReport } from "./income-report";
import { SavingsRateReport } from "./savings-rate-report";

/** Every report for one range. Loaded lazily by ReportsPage so the page shell paints first. */
export default function ReportSections({ range }: { range: DateRange }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <CashFlowReport range={range} />
      <CategorySpendingReport range={range} />
      <SavingsRateReport range={range} />
      <BudgetPerformanceReport range={range} />
      <CutoffComparisonReport range={range} />
      <IncomeReport range={range} />
      <ExpensesReport range={range} />
      <div className="xl:col-span-2">
        <AccountBalancesReport range={range} />
      </div>
    </div>
  );
}
