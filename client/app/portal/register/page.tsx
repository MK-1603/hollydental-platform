"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/useUIStore";

/**
 * Patient registration is a modal flow. This standalone route opens
 * the register modal and bounces back to the homepage.
 */
export default function PortalRegisterRedirect() {
  const router = useRouter();
  const { openRegisterModal } = useUIStore();

  useEffect(() => {
    openRegisterModal();
    router.replace("/");
  }, [router, openRegisterModal]);

  return (
    <div className="min-h-[100dvh] bg-white flex items-center justify-center text-navy">
      <p className="text-sm font-semibold">Opening registration…</p>
    </div>
  );
}
