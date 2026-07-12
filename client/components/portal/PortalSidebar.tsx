"use client";

import { useEffect, useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useLiveData } from "@/lib/useLiveData";
import Logo from "@/components/public/Logo";
import { LayoutDashboard, CalendarDays, History, FolderOpen, MessageSquare, User, LogOut, ClipboardList, Receipt, Bell, ShoppingBag, PackageCheck, X, Heart, HeartPulse } from "lucide-react";

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
            <Logo variant="full" theme="dark" size={40} asLink={false} />
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
          className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-4 border transition-all shrink-0 ${
            pathname.startsWith("/portal/ai")
              ? "bg-gold text-navy border-gold shadow-lg shadow-gold/20"
              : "bg-gold/10 hover:bg-gold/20 text-navy border-gold/20 hover:border-gold/40"
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-gold/20 flex items-center justify-center shrink-0">
            <HeartPulse className="w-3.5 h-3.5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-navy truncate">Clinical Support</p>
            <p className="text-[9px] text-gray-500 truncate">Ask about your care</p>
          </div>
          <HeartPulse className="w-3.5 h-3.5 text-gold shrink-0" />
        </Link>

        {/* Nav List */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1 no-scrollbar mb-6">
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
                className={`relative flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "text-gold bg-gold/5 border-l-4 border-gold pl-3"
                    : pendingHref === item.href
                    ? "text-gold bg-gold/10"
                    : "text-navy hover:text-gold hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive || pendingHref === item.href
                      ? "text-gold"
                      : "text-navy"
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
        <div className="border-t border-gray-100 pt-6 mt-auto space-y-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-bold text-gold text-xs">
              {user?.patientProfile?.firstName?.[0] || "P"}
            </div>
            <div className="truncate">
              <span className="block text-xs font-bold text-navy truncate">
                {user?.patientProfile?.firstName} {user?.patientProfile?.lastName}
              </span>
              <span className="inline-block bg-gold/10 text-gold text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5">
                Patient
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors focus:outline-none"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>
    </>
  );
}
