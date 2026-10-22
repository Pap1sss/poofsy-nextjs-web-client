import { routes } from "@/config/routes";
import { TabLinkSchema } from "@/lib/schemas";

export const queryKey = "users";
export const baseUrl = "/users";

export const userTabLinks: TabLinkSchema[] = [
  {
    title: "Details",
    url: (id: string) => routes.users.details(id),
  },
];

// Kept in its own import-free file so config/routes.ts can use it without an import cycle.
export { userPermissions } from "./permissions";
