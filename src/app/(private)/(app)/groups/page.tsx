import type { Metadata } from "next";

import GroupsPage from "@/features/group/components/GroupsPage";

export const metadata: Metadata = { title: "Groups" };

export default function Page() {
  return <GroupsPage />;
}
