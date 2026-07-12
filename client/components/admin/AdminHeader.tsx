"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useLiveData } from "@/lib/useLiveData";
import { Bell, Menu, LogOut, Settings, UserCircle, HelpCircle, Keyboard, MessagesSquare, ChevronDown, Moon, Sun } from "lucide-react";
import GlobalSearch from "@/components/admin/GlobalSearch";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, performLogoutTransition } = useAuthStore();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useLiveData<any[]>("/messages", {
    intervalMs: 30000,
    initialData: [],
  });

  const unreadMsgs = useMemo(
    () => messages.reduce((acc, t) => acc + (t.unreadFromPatient || 0), 0),
    [messages]
  );

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) setShowNotifDropdown(false);
      if (profileRef.current && !profileRef.current.contains(target)) setShowProfileDropdown(false);
      if (workspaceRef.current && !workspaceRef.current.contains(target)) setShowWorkspaceDropdown(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!user) return null;

  // Dynamic titles based on pathname for Breadcrumbs
  const breadcrumbSection = pathname.split('/').filter(Boolean)[1];
  const breadcrumbLabel = breadcrumbSection ? breadcrumbSection.charAt(0).toUpperCase() + breadcrumbSection.slice(1) : 'Dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center shrink-0 font-inter px-4 sm:px-6">
      <div className="flex items-center justify-between w-full h-full gap-4">
        
        {/* Left: Mobile Menu & Breadcrumbs */}
        <div className="flex items-center gap-3 md:gap-4 min-w-[200px]">
          <button
            onClick={onToggleSidebar}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 xl:hidden -ml-1 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="hidden md:flex items-center text-[13px] font-medium">
            <span className="text-gray-500 hover:text-gray-900 cursor-pointer transition-colors">HollyDental</span>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-gray-900 font-semibold">{breadcrumbLabel}</span>
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-[500px]">
          <GlobalSearch />
        </div>

        {/* Right: Workspace, Theme, Notifs, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Workspace Selector */}
          <div className="relative hidden md:block" ref={workspaceRef}>
            <button 
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="flex items-center gap-2 px-2.5 h-8 hover:bg-gray-100 rounded-md transition-colors text-[13px] font-medium text-gray-700"
            >
              <div className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">M</div>
              <span>Main Clinic</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {showWorkspaceDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <button className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-gray-50 text-gray-900 flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">M</div>
                  Main Clinic
                </button>
                <button className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-gray-50 text-gray-500 flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-[10px]">N</div>
                  North Branch
                </button>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-gray-200 hidden md:block mx-1"></div>

          {/* Theme Toggle (Placeholder for now) */}
          <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors hidden sm:flex">
            <Moon className="w-[18px] h-[18px]" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors relative"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadMsgs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                <div className="px-3 py-1 border-b border-gray-100 mb-1">
                  <h4 className="text-[13px] font-semibold text-gray-900">Notifications</h4>
                </div>
                <div className="max-h-64 overflow-y-auto px-1.5 pb-1">
                  {unreadMsgs > 0 ? (
                    <Link href="/admin/messages" onClick={() => setShowNotifDropdown(false)} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors">
                      <div className="w-7 h-7 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <MessagesSquare className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-gray-900 leading-tight">{unreadMsgs} Unread Messages</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">You have unread patient messages.</p>
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
          <div className="relative ml-1" ref={profileRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
            >
              {user?.profilePicUrl ? (
                <img src={user.profilePicUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[12px] text-white">
                  {user?.displayName?.[0] || "A"}
                </div>
              )}
            </button>
            
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                <div className="px-3 py-2 mb-1 border-b border-gray-100">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{user?.displayName || "Admin User"}</p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="px-1 py-1">
                  <Link href="/admin/settings/my-account" onClick={() => setShowProfileDropdown(false)} className="w-full flex items-center gap-2.5 px-2 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    <UserCircle className="w-4 h-4 text-gray-400" /> My Profile
                  </Link>
                  <Link href="/admin/settings" onClick={() => setShowProfileDropdown(false)} className="w-full flex items-center gap-2.5 px-2 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    <Settings className="w-4 h-4 text-gray-400" /> Settings
                  </Link>
                  <Link href="/admin/settings" onClick={() => setShowProfileDropdown(false)} className="w-full flex items-center gap-2.5 px-2 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    <Keyboard className="w-4 h-4 text-gray-400" /> Shortcuts
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
