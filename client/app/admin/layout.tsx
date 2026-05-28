"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  Users,
  FileText,
  Bell,
  CalendarClock,
  MessageSquare,
  LogOut,
  Menu,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import SessionWatcher from "@/components/auth/SessionWatcher";
import PushToggle from "@/components/common/PushToggle";
import { useLiveData } from "@/lib/useLiveData";
import LogoutOverlay from "@/components/common/LogoutOverlay";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isInitialized, initialize, isLoggingOut, performLogoutTransition } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 1280) {
      setSidebarOpen(true);
    }
  }, []);

  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Exclude auth route
  const isAuthRoute = pathname.includes("/admin/login");

  // Bootstrap session once on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, []); // run once on mount only

  // Use live data polling with automatic backoff and visibility awareness
  const { data: appts = [] } = useLiveData<any[]>(
    user?.role === "admin" ? "/appointments" : null,
    { intervalMs: 30000, initialData: [] }
  );

  const { data: messages = [] } = useLiveData<any[]>(
    user?.role === "admin" ? "/messages" : null,
    { intervalMs: 30000, initialData: [] }
  );

  const pendingAppts = useMemo(
    () => appts.filter((a) => a.status === "pending").length,
    [appts]
  );

  const unreadMsgs = useMemo(
    () => messages.reduce((acc, t) => acc + (t.unreadFromPatient || 0), 0),
    [messages]
  );

  // Notifications dropdown mouse-outside clicks click listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Redirect unauthenticated users away from protected admin routes
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

  if (isAuthRoute) {
    return <div className="bg-navy min-h-screen flex items-center justify-center p-4">{children}</div>;
  }

  // Show spinner only on the very first bootstrap.
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">Loading administration panel…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex bg-gray-100 h-screen overflow-hidden">
      {isLoggingOut && <LogoutOverlay />}
      {/* Idle / session-expiry watcher */}
      <SessionWatcher idleMinutes={30} />
      {/* Admin Navy Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        
        {/* Header bar */}
        <header className="h-[64px] bg-white border-b border-gray-200 flex items-center justify-between gap-3 px-4 sm:px-6 xl:px-8 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-navy transition-colors focus:outline-none cursor-pointer"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-serif text-base font-bold text-navy truncate">
              <span className="hidden sm:inline">Clinical Administration</span>
              <span className="sm:hidden">Clinical Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Push notifications toggle */}
            <PushToggle />
            {/* Notification Bell */}
            <div className="relative flex items-center" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-navy" />
                {pendingAppts + unreadMsgs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {pendingAppts + unreadMsgs}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showNotifDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl py-3 z-50 animate-fade-in text-xs text-navy font-sans font-semibold">
                  <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between gap-2">
                    <span className="font-sans text-sm font-bold text-navy">
                      Notifications
                    </span>
                    {pendingAppts + unreadMsgs > 0 && (
                      <span className="text-[10px] text-gold uppercase tracking-wider font-bold whitespace-nowrap">
                        New alerts
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                    {pendingAppts > 0 && (
                      <Link
                        href="/admin/approvals"
                        onClick={() => setShowNotifDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <CalendarClock className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="block text-navy font-bold">{pendingAppts} pending approvals</span>
                          <span className="block text-[10px] text-gray-400 font-normal mt-0.5">Click to approve or reschedule visits</span>
                        </div>
                      </Link>
                    )}

                    {unreadMsgs > 0 && (
                      <Link
                        href="/admin/messages"
                        onClick={() => setShowNotifDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-navy/5 text-navy flex items-center justify-center shrink-0">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="block text-navy font-bold">{unreadMsgs} unread messages</span>
                          <span className="block text-[10px] text-gray-400 font-normal mt-0.5">Direct chat logs awaiting reply</span>
                        </div>
                      </Link>
                    )}

                    {pendingAppts === 0 && unreadMsgs === 0 && (
                      <div className="py-8 text-center text-gray-400 flex flex-col items-center gap-1.5 font-normal">
                        <span className="text-sm">✨</span>
                        <span>All caught up! No alerts.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 border-l border-gray-100 pl-2 sm:pl-4">
              <div className="text-right hidden md:block">
                <span className="block text-xs font-bold text-navy whitespace-nowrap">
                  {user.email === "doctor@hollyhilldental.ie" ? "Dr. Roghay Alizadeh" : user.email.split("@")[0]}
                </span>
                <span className="block text-[9px] text-gold font-bold uppercase tracking-wider whitespace-nowrap">
                  {user.role === "admin" ? "Principal Dentist" : "Clinical Admin"}
                </span>
              </div>
              {user.profilePicUrl ? (
                <img
                  src={user.profilePicUrl}
                  alt="Doctor Avatar"
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-gold/30 shadow-inner"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gold text-navy flex items-center justify-center font-bold text-xs shrink-0 select-none">
                  {user.email[0]?.toUpperCase() || "D"}
                </div>
              )}
              <button
                onClick={() => performLogoutTransition(router)}
                className="p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-colors focus:outline-none cursor-pointer flex items-center justify-center border border-red-100 hover:border-red-200 shrink-0"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic pages */}
        <main className={`flex-1 ${
          pathname.endsWith("/messages")
            ? "overflow-hidden p-0 xl:p-8"
            : "overflow-y-auto p-4 xl:p-8 pb-24 xl:pb-8"
        }`}>
          {children}
        </main>
      </div>

      {/* Mobile Fixed Navigation Tab Bar (Replaces Sidebar on Mobile) */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-1 z-40 shadow-inner">
        {[
          { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
          { name: "Schedules", href: "/admin/appointments", icon: CalendarDays },
          { name: "Approvals", href: "/admin/approvals", icon: CalendarCheck, badge: pendingAppts },
          { name: "Messages", href: "/admin/messages", icon: MessageSquare, badge: unreadMsgs, badgeColor: "bg-red-500 text-white" },
          { name: "Patients", href: "/admin/patients", icon: Users },
          { name: "Invoices", href: "/admin/billing", icon: FileText }
        ].map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive ? "text-navy font-bold scale-105" : "text-gray-400 hover:text-navy"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`absolute -top-1.5 -right-2.5 ${item.badgeColor || "bg-gold text-navy"} text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[8px] mt-1 tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
