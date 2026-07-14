"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Standalone /portal route. Redirects directly to the patient dashboard
 * or lets the layout redirect to /portal/login if unauthenticated.
 */
export default function PortalIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/portal/dashboard");
  }, [router]);

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
