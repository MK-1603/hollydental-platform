"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUIStore } from "@/store/useUIStore";

/**
 * Standalone /login route. We no longer have a full-page login —
 * authentication lives inside the LoginModal. This route bounces the
 * user back to the homepage and opens the modal automatically.
 *
 * `useSearchParams` triggers Next.js's CSR bailout, so the inner
 * implementation is wrapped in a Suspense boundary to keep the
 * production build prerender-safe.
 */
function LoginRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openLoginModal } = useUIStore();

  useEffect(() => {
    const next = searchParams.get("next");
    openLoginModal(
      next && next.startsWith("/") ? () => router.replace(next) : undefined
    );
    router.replace("/");
  }, [router, searchParams, openLoginModal]);

  return (
    <div className="min-h-[100dvh] bg-white flex items-center justify-center text-navy">
      <p className="text-sm font-semibold">Opening sign-in…</p>
    </div>
  );
}

export default function LoginRedirect() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-white flex items-center justify-center text-navy">
          <p className="text-sm font-semibold">Opening sign-in…</p>
        </div>
      }
    >
      <LoginRedirectInner />
    </Suspense>
  );
}
