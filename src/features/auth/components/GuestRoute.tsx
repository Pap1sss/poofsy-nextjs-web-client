"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthenticatedUser } from "../api/useAuthenticatedUser";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

const DEFAULT_LOGIN_REDIRECT_URL = "/dashboard";

// Only same-site paths, so `?redirectTo=https://evil.example` can't bounce users off-site.
const safeRedirect = (target: string | null) =>
  target && target.startsWith("/") && !target.startsWith("//")
    ? target
    : DEFAULT_LOGIN_REDIRECT_URL;

export default function GuestRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: auth, isError, error, isSuccess, isLoading, isFetching } = useAuthenticatedUser();

  const isAuthenticated = !!auth && !!auth.data && !!auth.success && isSuccess;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(safeRedirect(searchParams.get("redirectTo")));
    }
  }, [isSuccess, isAuthenticated, router, searchParams]);

  if (isError) return <Error message={error?.message} />;

  return isLoading || isFetching || isAuthenticated ? <Loading /> : <>{children}</>;
}
