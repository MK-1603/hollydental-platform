"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/useUIStore";

/**
 * Admin login is the same modal as everyone else. This route just
 * opens the modal and bounces home; role-based redirect happens after
 * successful sign-in.
 */
export default function AdminLoginRedirect() {
  const router = useRouter();
  const { openLoginModal } = useUIStore();

  useEffect(() => {
    openLoginModal();
    router.replace("/");
  }, [router, openLoginModal]);

  return (
    <div className="min-h-[100dvh] bg-white flex items-center justify-center text-navy">
      <p className="text-sm font-semibold">Opening sign-in…</p>
    </div>
  );
}
