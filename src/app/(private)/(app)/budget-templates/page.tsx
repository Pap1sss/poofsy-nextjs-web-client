import type { Metadata } from "next";

import { TemplatesList } from "@/features/budget-template/components/templates-list";

export const metadata: Metadata = { title: "Budget Templates" };

export default function BudgetTemplatesPage() {
  return (
    <div className="page-container">
      <TemplatesList />
    </div>
  );
}
