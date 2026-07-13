"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import PortalSidebar from "@/components/portal/PortalSidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PortalBrand from "@/components/portal/PortalBrand";
import { LayoutDashboard, CalendarDays, MessageSquare, User, Bell, LogOut, Menu, Heart, Send, Activity, X, Phone } from "lucide-react";
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
        <header className="h-[68px] bg-white/80 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-5 xl:px-8 shrink-0 sticky top-0 z-30 transition-all">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="xl:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors focus:outline-none active:scale-95"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="xl:hidden">
              <PortalBrand size={24} asLink={false} />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <a 
              href="tel:+353214303072" 
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F4FBFF] text-[#009BDE] font-semibold text-[13.5px] tracking-wide border border-[#D2EAF8] shadow-sm shadow-[#009BDE]/5 hover:bg-[#EAF6FD] hover:border-[#BCE0F5] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all"
            >
              <Phone className="w-[18px] h-[18px]" strokeWidth={2.2} /> Call
            </a>

            <PushToggle />

            <Link 
              href="/portal/notifications" 
              className="relative w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-navy transition-all active:scale-95" 
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" strokeWidth={2} />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-[#EF4444] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm border border-white">
                  {unreadNotifsCount}
                </span>
              )}
            </Link>

            <div className="h-7 w-[1px] bg-gray-200 hidden sm:block rounded-full" />

            <div className="flex items-center gap-3 sm:gap-4 pl-1">
              <div className="hidden md:flex flex-col items-end justify-center">
                <span className="text-[13px] font-bold text-navy leading-tight tracking-wide">
                  {user.patientProfile?.firstName} {user.patientProfile?.lastName}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  Patient
                </span>
              </div>
              
              <Link 
                href="/portal/profile" 
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#009BDE] to-[#60C6FF] text-white flex items-center justify-center font-bold text-[13px] shadow-sm shadow-[#009BDE]/20 hover:shadow-md hover:scale-105 transition-all select-none border border-[#009BDE]/10"
              >
                {((user.patientProfile?.firstName?.[0] || "") + (user.patientProfile?.lastName?.[0] || "")).toUpperCase() || "P"}
              </Link>
              
              <button
                onClick={() => performLogoutTransition(router)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#FEF2F2] hover:text-[#EF4444] transition-colors active:scale-95"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </header>

        <main className={`flex-1 ${
          pathname.endsWith("/messages") || pathname.endsWith("/ai")
            ? "overflow-hidden p-0 pb-16 xl:pb-0 h-full flex flex-col"
            : "overflow-y-auto p-4 xl:p-6 pb-20 xl:pb-6"
        }`}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-1 z-40 shadow-inner">
        {[
          { name: "Home", href: "/portal/dashboard", icon: LayoutDashboard },
          { name: "Booking", href: "/portal/appointments", icon: CalendarDays },
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
