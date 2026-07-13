"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import SessionWatcher from "@/components/auth/SessionWatcher";
import LogoutOverlay from "@/components/common/LogoutOverlay";
import { useLiveData } from "@/lib/useLiveData";
import MobileBottomNav from "@/components/admin/MobileBottomNav";
import { CommandPalette } from "@/components/CommandPalette";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isInitialized, initialize, isLoggingOut } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("hollydental_sidebar_collapsed");
    if (saved) {
      setIsCollapsed(saved === "true");
    }
    if (window.innerWidth < 1280) {
      setSidebarOpen(false);
    }
  }, []);

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("hollydental_sidebar_collapsed", String(next));
  };

  const isAuthRoute = pathname.includes("/admin/login");

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, []);

  useEffect(() => {
    if (!isInitialized || isAuthRoute || isLoggingOut) return;
    if (!user) {
      router.replace("/admin/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/portal/dashboard");
      return;
    }
    if (user.mustChangePassword && !pathname.startsWith("/admin/change-password")) {
      router.replace(
        `/admin/change-password?next=${encodeURIComponent(pathname)}`
      );
    }
  }, [isInitialized, isAuthRoute, user, router, pathname]);

  const { data: appointments = [] } = useLiveData<any[]>("/appointments", {
    intervalMs: 15000,
    initialData: [],
  });

  const { data: messages = [] } = useLiveData<any[]>("/messages", {
    intervalMs: 15000,
    initialData: [],
  });

  const [pendingAppts, setPendingAppts] = useState<number>(0);
  const [unreadMsgs, setUnreadMsgs] = useState<number>(0);

  useEffect(() => {
    if (Array.isArray(appointments)) {
      setPendingAppts(appointments.filter((a) => a.status === "pending").length);
    }
  }, [appointments]);

  useEffect(() => {
    if (Array.isArray(messages)) {
      setUnreadMsgs(messages.reduce((acc, t) => acc + (t.unreadFromPatient || 0), 0));
    }
  }, [messages]);

  if (isAuthRoute) {
    return <div className="bg-admin-bg min-h-screen flex items-center justify-center p-4 font-sans text-admin-text">{children}</div>;
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg font-sans">
        <div className="w-6 h-6 border-2 border-admin-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="admin-theme bg-admin-bg font-sans text-admin-text h-screen w-full overflow-hidden flex relative">
      {isLoggingOut && <LogoutOverlay />}
      <SessionWatcher idleMinutes={30} />
      <CommandPalette />
      
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isCollapsed={isMounted ? isCollapsed : false} 
        onToggleCollapse={handleToggleCollapse} 
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden flex flex-col bg-white pb-16 md:pb-0">
          {children}
        </main>
      </div>
      
      {/* Mobile Fixed Navigation Tab Bar */}
      <MobileBottomNav />
    </div>
  );
}
