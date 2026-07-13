"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useLiveData } from "@/lib/useLiveData";
import { Bell, Menu, LogOut, Settings, UserCircle, MessagesSquare, Phone } from "lucide-react";
import PortalGlobalSearch from "@/components/portal/PortalGlobalSearch";
import PushToggle from "@/components/common/PushToggle";
import PortalBrand from "@/components/portal/PortalBrand";

interface PortalHeaderProps {
  onToggleSidebar: () => void;
}

export default function PortalHeader({ onToggleSidebar }: PortalHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, performLogoutTransition } = useAuthStore();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) setShowNotifDropdown(false);
      if (profileRef.current && !profileRef.current.contains(target)) setShowProfileDropdown(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 h-16 flex items-center shrink-0 font-sans px-4 sm:px-6 md:px-8 transition-all">
      <div className="flex items-center justify-between w-full h-full">
        
        {/* Left: Mobile Menu & Brand */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-500 xl:hidden -ml-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="xl:hidden">
            <PortalBrand size={24} asLink={false} />
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="flex justify-center w-full max-w-[640px] px-4">
          <PortalGlobalSearch />
        </div>

        {/* Right: Actions, Notifs, Profile */}
        <div className="flex items-center justify-end gap-2 sm:gap-4 md:gap-5 flex-1 shrink-0">

          <a 
            href="tel:+353214303072" 
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-blue-50 text-blue-700 font-semibold text-[13px] tracking-wide whitespace-nowrap hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <Phone className="w-4 h-4" strokeWidth={2.2} /> Call Clinic
          </a>

          <div className="hidden sm:block">
            <PushToggle />
          </div>

          <div className="h-5 w-px bg-gray-100 hidden md:block mx-1"></div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors relative focus:outline-none"
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                <div className="px-3 py-1 border-b border-gray-100 mb-1">
                  <h4 className="text-[13px] font-semibold text-gray-900">Notifications</h4>
                </div>
                <div className="max-h-64 overflow-y-auto px-1.5 pb-1">
                  {unreadNotifsCount > 0 ? (
                    <Link href="/portal/notifications" onClick={() => setShowNotifDropdown(false)} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors">
                      <div className="w-7 h-7 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-gray-900 leading-tight">{unreadNotifsCount} New Notifications</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">You have unread updates.</p>
                      </div>
                    </Link>
                  ) : (
                    <div className="py-6 text-center text-[12px] text-gray-500">You're all caught up!</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative ml-1 md:ml-0" ref={profileRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center hover:opacity-80 transition-all focus:outline-none ring-2 ring-transparent hover:ring-blue-100 rounded-full"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold text-[12px] md:text-[13px] shadow-sm">
                {((user.patientProfile?.firstName?.[0] || "") + (user.patientProfile?.lastName?.[0] || "")).toUpperCase() || "P"}
              </div>
            </button>
            
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <div className="px-3 py-2 mb-1 border-b border-gray-100">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {user?.patientProfile?.firstName} {user?.patientProfile?.lastName}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="px-1 py-1">
                  <Link href="/portal/profile" onClick={() => setShowProfileDropdown(false)} className="w-full flex items-center gap-2.5 px-2 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    <UserCircle className="w-4 h-4 text-gray-400" /> My Profile
                  </Link>
                </div>
                <div className="h-px bg-gray-100 my-1 mx-1" />
                <div className="px-1 py-1">
                  <button
                    onClick={() => performLogoutTransition(router)}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 text-[13px] text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
