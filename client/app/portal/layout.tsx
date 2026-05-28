"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import PortalSidebar from "@/components/portal/PortalSidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CalendarDays, MessageSquare, User, Bell, LogOut, Menu, Heart, Send, Sparkles, X } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import SessionWatcher from "@/components/auth/SessionWatcher";
import PushToggle from "@/components/common/PushToggle";
import { useLiveData } from "@/lib/useLiveData";
import LogoutOverlay from "@/components/common/LogoutOverlay";
import { apiRequest } from "@/lib/api";

const AUTH_ROUTES = [
  "/portal/login",
  "/portal/register",
  "/portal/forgot-password",
  "/portal/reset-password",
];



export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isInitialized, initialize, isLoggingOut, performLogoutTransition } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!isInitialized) initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: notifications = [] } = useLiveData<any[]>(
    user?.role === "patient" ? "/notifications/me" : null,
    { intervalMs: 15000, initialData: [] }
  );

  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  useEffect(() => {
    if (pathname === "/portal/notifications") {
      localStorage.setItem("lastSeenNotifications", new Date().toISOString());
      setUnreadNotifsCount(0);
    } else {
      const lastSeen = localStorage.getItem("lastSeenNotifications");
      if (!lastSeen) {
        setUnreadNotifsCount(notifications.length > 0 ? 1 : 0);
      } else {
        const lastSeenDate = new Date(lastSeen).getTime();
        setUnreadNotifsCount(notifications.filter((n: any) => new Date(n.timestamp).getTime() > lastSeenDate).length);
      }
    }
  }, [notifications, pathname]);

  const { data: messages = [] } = useLiveData<any[]>(
    user?.patientProfile?.id ? `/messages/${user.patientProfile.id}` : null,
    { intervalMs: 15000, initialData: [] }
  );
  const unreadMessagesCount = useMemo(
    () => messages.filter((m) => m?.senderRole === "admin" && !m?.isRead).length,
    [messages]
  );

  useEffect(() => {
    if (!isInitialized || isAuthRoute || isLoggingOut) return;
    if (!user) { router.replace(`/portal/login?next=${encodeURIComponent(pathname)}`); return; }
    if (user.role === "admin") { router.replace("/admin/dashboard"); return; }
    if (user.mustChangePassword && !pathname.startsWith("/portal/change-password")) {
      router.replace(`/portal/change-password?next=${encodeURIComponent(pathname)}`);
    }
  }, [isInitialized, isAuthRoute, user, router, pathname]);

  if (isAuthRoute) {
    return <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">{children}</div>;
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">Loading your patient session…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex bg-gray-50 h-screen overflow-hidden">
      {isLoggingOut && <LogoutOverlay />}
      <SessionWatcher idleMinutes={30} />

      {/* Sidebar */}
      <PortalSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Fixed header */}
        <header className="h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-4 xl:px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="xl:hidden p-1.5 rounded-lg hover:bg-gray-100 text-navy transition-colors focus:outline-none"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-serif text-sm font-bold text-navy">Patient Portal</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <PushToggle />

            <Link href="/portal/notifications" className="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors" aria-label="Notifications">
              <Bell className="w-5 h-5 text-navy" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gold text-navy text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </Link>

            <a href="tel:+353214303072" className="hidden sm:inline-flex items-center gap-1 text-gold font-bold text-xs bg-gold/10 px-3 py-1.5 rounded-full hover:bg-gold/20 transition-all whitespace-nowrap">
              📞 Call
            </a>

            <div className="flex items-center gap-2 border-l border-gray-100 pl-2 sm:pl-3">
              <div className="hidden md:block text-right">
                <span className="block text-xs font-bold text-navy whitespace-nowrap">
                  {user.patientProfile?.firstName} {user.patientProfile?.lastName}
                </span>
                <span className="block text-[9px] text-gold font-bold uppercase tracking-wider">Patient</span>
              </div>
              <Link href="/portal/profile" className="w-8 h-8 rounded-full bg-gold/20 text-navy flex items-center justify-center font-bold text-xs border border-gold/40 shrink-0 select-none hover:bg-gold/30 transition-colors">
                {((user.patientProfile?.firstName?.[0] || "") + (user.patientProfile?.lastName?.[0] || "")).toUpperCase() || "P"}
              </Link>
              <button
                onClick={() => performLogoutTransition(router)}
                className="p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-colors border border-red-100 hover:border-red-200 shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className={`flex-1 ${
          pathname.endsWith("/messages") || pathname.startsWith("/portal/ai")
            ? "overflow-hidden p-0 h-full flex flex-col"
            : "overflow-y-auto p-4 xl:p-6 pb-20 xl:pb-6"
        }`}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-1 z-40 shadow-inner">
        {[
          { name: "Home", href: "/portal/dashboard", icon: LayoutDashboard },
          { name: "Appts", href: "/portal/appointments", icon: CalendarDays },
          { name: "Wellness", href: "/portal/wellness", icon: Heart },
          { name: "Chat", href: "/portal/messages", icon: MessageSquare, badge: unreadMessagesCount, badgeColor: "bg-red-500 text-white" },
          { name: "Profile", href: "/portal/profile", icon: User },
        ].map((item) => {
          const isActive = pathname === item.href || (item.href !== "/portal/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive ? "text-gold" : "text-gray-400 hover:text-gold"}`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`absolute -top-1.5 -right-2 ${item.badgeColor || "bg-gold text-navy"} text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] mt-0.5 font-semibold ${isActive ? "text-gold" : ""}`}>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
