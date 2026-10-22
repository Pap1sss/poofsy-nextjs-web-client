import type { Metadata } from "next";

import { TemplateEditor } from "@/features/budget-template/components/template-editor";

export const metadata: Metadata = { title: "Edit template" };

export default async function BudgetTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="page-container">
      <TemplateEditor templateId={id} />
    </div>
  );
}
