"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalMobileBottomNav from "@/components/portal/PortalMobileBottomNav";
import SessionWatcher from "@/components/auth/SessionWatcher";
import LogoutOverlay from "@/components/common/LogoutOverlay";
import { useAuthStore } from "@/store/useAuthStore";

const AUTH_ROUTES = [
  "/portal/login",
  "/portal/register",
  "/portal/forgot-password",
  "/portal/reset-password",
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isInitialized, initialize, isLoggingOut } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("portalSidebarCollapsed");
    if (stored !== null) {
      setIsCollapsed(stored === "true");
    }

    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem("portalSidebarCollapsed", String(newVal));
  };

  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!isInitialized) initialize();
  }, [initialize, isInitialized]);

  useEffect(() => {
    if (!isInitialized || isAuthRoute || isLoggingOut) return;
    if (!user) { router.replace(`/portal/login?next=${encodeURIComponent(pathname)}`); return; }
    if (user.role === "admin") { router.replace("/admin/dashboard"); return; }
    if (user.mustChangePassword && !pathname.startsWith("/portal/change-password")) {
      router.replace(`/portal/change-password?next=${encodeURIComponent(pathname)}`);
    }
  }, [isInitialized, isAuthRoute, user, router, pathname, isLoggingOut]);

  if (isAuthRoute) {
    return <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">{children}</div>;
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">Loading your patient session…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex bg-gray-50 h-screen w-full overflow-hidden relative">
      {isLoggingOut && <LogoutOverlay />}
      <SessionWatcher idleMinutes={30} />

      <PortalSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isMounted ? isCollapsed : false}
        onToggleCollapse={handleToggleCollapse}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <PortalHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className={`flex-1 w-full min-w-0 flex flex-col bg-white overflow-y-auto overflow-x-hidden ${
          pathname.endsWith("/messages") || pathname.endsWith("/ai")
            ? "pb-16 xl:pb-0"
            : "pb-20 xl:pb-6 p-4 xl:p-6"
        }`}>
          {children}
        </main>
      </div>

      {/* Mobile Fixed Navigation Tab Bar */}
      <PortalMobileBottomNav />
    </div>
  );
}
