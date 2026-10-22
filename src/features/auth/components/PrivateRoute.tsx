"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthenticatedUser } from "../api/useAuthenticatedUser";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import { routes } from "@/config/routes";

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: auth, isError, error, isSuccess, isFetched } = useAuthenticatedUser();

  const isAuthenticated = !!auth && !!auth.data && !!auth.success && isSuccess;
  // Budgeting needs a currency and pay schedule first. Super-admins run the back office and may skip it.
  const needsOnboarding =
    isAuthenticated &&
    !auth.data?.onboarded &&
    !auth.data?.roles.includes("super-admin") &&
    pathname !== routes.onboarding;

  useEffect(() => {
    if (isFetched && !isAuthenticated) {
      router.replace(`${routes.login}?redirectTo=${encodeURIComponent(pathname)}`);
    } else if (needsOnboarding) {
      router.replace(routes.onboarding);
    }
  }, [router, isAuthenticated, needsOnboarding, isFetched, pathname]);

  if (isAuthenticated && isFetched && !needsOnboarding) return <>{children}</>;
  if (isError) return <Error message={error?.message} />;
  return <Loading />;
}
