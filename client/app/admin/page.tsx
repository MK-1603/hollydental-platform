"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Standalone /admin route. Redirects directly to the admin dashboard
 * or lets the layout redirect to /admin/login if unauthenticated.
 */
export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
