"use client";

import { useEffect, useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useLiveData } from "@/lib/useLiveData";
import PortalBrand from "@/components/portal/PortalBrand";
import { LayoutDashboard, CalendarDays, History, FolderOpen, MessageSquare, User, LogOut, ClipboardList, Receipt, Bell, ShoppingBag, PackageCheck, X, Heart, HeartHandshake } from "lucide-react";

interface PortalSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function PortalSidebar({ isOpen, onClose }: PortalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, performLogoutTransition } = useAuthStore();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Clear the optimistic highlight as soon as the new route is committed.
  useEffect(() => {
    if (pendingHref && pathname.startsWith(pendingHref)) {
      setPendingHref(null);
    }
  }, [pathname, pendingHref]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    // Allow modifier-clicks (new tab, etc.) to behave normally.
    if (
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0
    ) {
      return;
    }
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

  // Live feeds for sidebar badge counters
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

  const navItems = [
    { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    { name: "Notifications", href: "/portal/notifications", icon: Bell },
    { name: "My Appointments", href: "/portal/appointments", icon: CalendarDays },
    { name: "Dental Chart", href: "/portal/chart", icon: ClipboardList },
    { name: "Treatment History", href: "/portal/treatments", icon: History },
    { name: "Wellness Hub", href: "/portal/wellness", icon: Heart },
    { name: "Prescriptions", href: "/portal/prescriptions", icon: ClipboardList },
    { name: "Invoices & Billing", href: "/portal/invoices", icon: Receipt },
    { name: "My Files", href: "/portal/files", icon: FolderOpen },
    { name: "Oral Care Products", href: "/portal/products", icon: ShoppingBag },
    { name: "My Orders", href: "/portal/orders", icon: PackageCheck },
    { name: "Messages", href: "/portal/messages", icon: MessageSquare },
    { name: "Profile Settings", href: "/portal/profile", icon: User },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 xl:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={`bg-white border-r border-gray-100 p-6 flex flex-col transition-transform duration-300 overflow-hidden h-screen z-50
          fixed top-0 left-0 w-full sm:w-[300px]
          xl:sticky xl:top-0 xl:left-auto xl:w-[260px] xl:!translate-x-0 xl:shrink-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        
        {/* Brand logo */}
        <div className="mb-10 flex items-center justify-between shrink-0">
          <Link
            href="/portal/dashboard"
            className="flex items-center min-w-0"
            onClick={onClose}
          >
            <PortalBrand size={32} asLink={false} />
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="xl:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Clinical Support CTA button */}
        <Link
          href="/portal/ai"
          onClick={(e) => handleNavClick(e, "/portal/ai")}
          className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-6 border transition-all shrink-0 ${
            pathname.startsWith("/portal/ai")
              ? "bg-[#009BDE] text-white border-[#009BDE] shadow-xl shadow-[#009BDE]/20"
              : "bg-[#F4FBFF] hover:bg-[#EAF6FD] text-navy border-[#E4F4FD] hover:border-[#D2EAF8]"
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-[#DDF0FB] flex items-center justify-center shrink-0">
            <HeartHandshake className="w-4 h-4 text-[#009BDE]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-navy truncate tracking-wide">Clinical Support</p>
            <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">Ask about your care</p>
          </div>
          <HeartHandshake className="w-4 h-4 text-[#009BDE] shrink-0 opacity-80" />
        </Link>

        {/* Nav List */}
        <nav className="flex-1 space-y-2 overflow-y-auto pr-1 no-scrollbar mb-6">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            let badge = null;
            if (item.name === "Notifications" && unreadNotifsCount > 0) {
              badge = (
                <span className="ml-auto bg-gold text-navy text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {unreadNotifsCount}
                </span>
              );
            } else if (item.name === "Messages" && unreadMessagesCount > 0) {
              badge = (
                <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
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
                aria-busy={pendingHref === item.href}
                className={`relative flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13.5px] font-semibold tracking-wide transition-all overflow-hidden ${
                  isActive
                    ? "text-[#009BDE] bg-[#F7FCFF] before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-[#009BDE] before:rounded-r-full"
                    : pendingHref === item.href
                    ? "text-[#009BDE] bg-[#F7FCFF]"
                    : "text-[#1C3B5E] hover:text-[#009BDE] hover:bg-[#FAFDFF]"
                }`}
              >
                <Icon
                  strokeWidth={2.2}
                  className={`w-[18px] h-[18px] ${
                    isActive || pendingHref === item.href
                      ? "text-[#009BDE]"
                      : "text-[#4A6482]"
                  } ${
                    pendingHref === item.href && isPending ? "animate-pulse" : ""
                  }`}
                />
                <span>{item.name}</span>
                {badge}
                {pendingHref === item.href && isPending && (
                  <span
                    aria-hidden
                    className="absolute right-3 inline-block w-3 h-3 border-2 border-gold border-t-transparent rounded-full animate-spin"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="pt-6 mt-auto shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-[#EAF6FD] border border-[#DDF0FB] flex items-center justify-center font-bold text-[#009BDE] text-sm shadow-sm">
              {user?.patientProfile?.firstName?.[0] || "P"}
            </div>
            <div className="truncate">
              <span className="block text-[13px] font-bold text-navy truncate tracking-wide">
                {user?.patientProfile?.firstName || "SAI"} {user?.patientProfile?.lastName || "CSE"}
              </span>
              <span className="inline-block bg-[#EAF6FD] text-[#009BDE] text-[10px] font-bold px-3 py-0.5 rounded-full mt-0.5 tracking-wider uppercase">
                Patient
              </span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13.5px] font-semibold text-[#EF4444] hover:bg-red-50/50 transition-colors focus:outline-none"
          >
            <LogOut strokeWidth={2.2} className="w-[18px] h-[18px] text-[#EF4444]" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>
    </>
  );
}
