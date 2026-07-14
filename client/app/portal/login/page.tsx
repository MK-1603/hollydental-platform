"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUIStore } from "@/store/useUIStore";

function PortalLoginRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openLoginModal } = useUIStore();

  useEffect(() => {
    const next = searchParams.get("next");
    openLoginModal(
      next && next.startsWith("/")
        ? () => router.replace(next)
        : undefined
    );
    router.replace("/");
  }, [router, searchParams, openLoginModal]);

  return (
    <div className="min-h-[100dvh] bg-white flex items-center justify-center text-navy">
      <p className="text-sm font-semibold">Opening sign-in…</p>
    </div>
  );
}

export default function PortalLoginRedirect() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-white flex items-center justify-center text-navy">
          <p className="text-sm font-semibold">Opening sign-in…</p>
        </div>
      }
    >
      <PortalLoginRedirectInner />
    </Suspense>
  );
}
