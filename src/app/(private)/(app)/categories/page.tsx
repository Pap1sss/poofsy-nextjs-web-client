import type { Metadata } from "next";

import CategoriesPage from "@/features/category/components/CategoriesPage";

export const metadata: Metadata = { title: "Categories" };

export default function Page() {
  return <CategoriesPage />;
}
