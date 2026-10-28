import type { Metadata } from "next";

import { GroupDetailPage } from "@/features/group/components/GroupDetailPage";

export const metadata: Metadata = { title: "Group" };

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="page-container">
      <GroupDetailPage groupId={id} />
    </div>
  );
}
