"use client";

import { useEffect, useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useLiveData } from "@/lib/useLiveData";
import PortalBrand from "@/components/portal/PortalBrand";
import { LayoutDashboard, CalendarDays, History, FolderOpen, MessageSquare, User, LogOut, ClipboardList, Receipt, Bell, ShoppingBag, PackageCheck, X, Heart, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

import { Menu } from "lucide-react";

interface PortalSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function PortalSidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: PortalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, performLogoutTransition } = useAuthStore();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (pendingHref && pathname.startsWith(pendingHref)) {
      setPendingHref(null);
    }
  }, [pathname, pendingHref]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (pathname === href) {
      e.preventDefault();
      onClose?.();
      return;
    }
    e.preventDefault();
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
      onClose?.();
    });
  };

  const handleLogout = () => {
    performLogoutTransition(router);
    onClose?.();
  };

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
        const newNotifs = notifications.filter(
          (n) => new Date(n.timestamp).getTime() > lastSeenDate
        );
        setUnreadNotifsCount(newNotifs.length);
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

  const navGroups = useMemo(() => [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
        { name: "Notifications", href: "/portal/notifications", icon: Bell },
        { name: "Messages", href: "/portal/messages", icon: MessageSquare },
      ]
    },
    {
      title: "Care & Records",
      items: [
        { name: "Dental Chart", href: "/portal/chart", icon: ClipboardList },
        { name: "Treatment History", href: "/portal/treatments", icon: History },
        { name: "Prescriptions", href: "/portal/prescriptions", icon: ClipboardList },
      ]
    },
    {
      title: "Appointments",
      items: [
        { name: "My Appointments", href: "/portal/appointments", icon: CalendarDays },
        { name: "Wellness Hub", href: "/portal/wellness", icon: Heart },
      ]
    },
    {
      title: "Business & AI",
      items: [
        { name: "Invoices & Billing", href: "/portal/invoices", icon: Receipt },
        { name: "My Files", href: "/portal/files", icon: FolderOpen },
        { name: "Products", href: "/portal/products", icon: ShoppingBag },
        { name: "My Orders", href: "/portal/orders", icon: PackageCheck },
        { name: "AI Assistant", href: "/portal/ai", icon: Bot },
      ]
    }
  ], []);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 xl:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed xl:sticky top-0 left-0 h-screen bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out z-50 shrink-0",
          isCollapsed ? "w-[80px]" : "w-full sm:w-[300px] xl:w-[280px]",
          isOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
        )}
      >
        
        {/* Header / Logo */}
        <div className={cn("flex items-center shrink-0 mb-6 mt-6", isCollapsed ? "justify-center" : "px-6 justify-between")}>
          <div className={cn("flex items-center overflow-hidden transition-all", isCollapsed ? "w-0 opacity-0 hidden" : "gap-3")}>
            <Link
              href="/portal/dashboard"
              className="flex items-center min-w-0"
              onClick={onClose}
            >
              <PortalBrand size={32} asLink={false} />
            </Link>
          </div>
          <button onClick={onToggleCollapse} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none hidden xl:block" aria-label="Toggle Sidebar">
            <Menu className="w-5 h-5" />
          </button>
          {onClose && (
            <button onClick={onClose} className="xl:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none" aria-label="Close sidebar">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className="px-6 pb-6 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 border border-blue-100/50 rounded-full w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-blue-700 tracking-wider uppercase">Holly AI Active</span>
            </div>
          </div>
        )}

        {/* Nav List */}
        <div className={cn("flex-1 overflow-y-auto custom-scrollbar space-y-6 py-6 mb-4", isCollapsed ? "px-2" : "px-4")}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="flex flex-col">
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[11px] font-black tracking-[0.15em] text-gray-400 uppercase">
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;

                  let badge = null;
                  if (item.name === "Notifications" && unreadNotifsCount > 0) {
                    badge = (
                      <span className={cn("bg-blue-100 text-blue-700 font-bold rounded-full shadow-sm flex items-center justify-center", isCollapsed ? "absolute top-1 right-1 w-4 h-4 text-[9px]" : "ml-auto px-2 py-0.5 text-[10px]")}>
                        {unreadNotifsCount}
                      </span>
                    );
                  } else if (item.name === "Messages" && unreadMessagesCount > 0) {
                    badge = (
                      <span className={cn("bg-red-500 text-white font-bold rounded-full shadow-sm animate-pulse flex items-center justify-center", isCollapsed ? "absolute top-1 right-1 w-4 h-4 text-[9px]" : "ml-auto px-2 py-0.5 text-[10px]")}>
                        {unreadMessagesCount}
                      </span>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={cn(
                        "relative flex items-center gap-3.5 rounded-xl transition-all overflow-hidden group",
                        isCollapsed ? "justify-center p-3" : "px-3 py-2.5",
                        isActive
                          ? "bg-blue-50 border border-blue-100/50 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] text-blue-900"
                          : pendingHref === item.href
                          ? "bg-blue-50/50 text-blue-900"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent"
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full"></div>
                      )}
                      <Icon
                        strokeWidth={isActive ? 2.5 : 2}
                        className={cn("shrink-0 transition-colors", isCollapsed ? "w-5 h-5" : "w-4 h-4", isActive || pendingHref === item.href ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")}
                      />
                      
                      {!isCollapsed && (
                        <span className="text-[13px] font-bold tracking-wide truncate">{item.name}</span>
                      )}
                      {badge}
                      
                      {pendingHref === item.href && isPending && (
                        <span className={cn("absolute border-blue-500 border-t-transparent rounded-full animate-spin border-2", isCollapsed ? "w-full h-full inset-0 m-auto" : "right-3 w-3 h-3")} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User profile & Settings */}
        <div className={cn("shrink-0 border-t border-gray-100 bg-white flex flex-col gap-2", isCollapsed ? "p-2" : "p-4")}>
          
          <Link
            href="/portal/profile"
            onClick={onClose}
            className={cn("flex items-center gap-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group", isCollapsed ? "justify-center p-2" : "p-3")}
            title={isCollapsed ? "Manage Profile" : undefined}
          >
            <div className={cn("shrink-0 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm shadow-sm group-hover:border-blue-200 transition-colors", isCollapsed ? "w-10 h-10" : "w-9 h-9")}>
              {user?.patientProfile?.firstName?.[0] || "P"}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-gray-900 truncate">
                  {user?.patientProfile?.firstName || "SAI"} {user?.patientProfile?.lastName || "CSE"}
                </span>
                <span className="text-[11px] font-semibold text-gray-500 truncate block mt-0.5">
                  Manage Profile
                </span>
              </div>
            )}
          </Link>
          
          <button
            onClick={handleLogout}
            className={cn("w-full flex items-center justify-center gap-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors focus:outline-none", isCollapsed ? "p-3" : "px-4 py-2.5 text-[12px] font-bold")}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut strokeWidth={2.5} className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>

      </aside>
    </>
  );
}
