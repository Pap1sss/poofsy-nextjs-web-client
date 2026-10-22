"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "./Loading";

type Navigate = { to: string; replace?: boolean };

export default function Navigate({ to, replace = false }: Navigate) {
  const router = useRouter();

  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [replace, router, to]);

  return <Loading />;
}
