"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CalendarDays, Heart, MessageSquare, User, MoreHorizontal, History, ClipboardList, Receipt, FolderOpen, ShoppingBag, PackageCheck, Bot, UserCircle, LogOut, FileText, ChevronRight, Activity, CalendarPlus } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useLiveData } from "@/lib/useLiveData";

export default function PortalMobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, performLogoutTransition } = useAuthStore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Live feeds for badges
  const { data: notifications = [] } = useLiveData<any[]>(
    user?.role === "patient" ? "/notifications/me" : null,
    { intervalMs: 15000, initialData: [] }
  );

  const { data: messages = [] } = useLiveData<any[]>(
    user?.patientProfile?.id ? `/messages/${user.patientProfile.id}` : null,
    { intervalMs: 15000, initialData: [] }
  );

  const unreadMessagesCount = useMemo(
    () => messages.filter((m) => m?.senderRole === "admin" && !m?.isRead).length,
    [messages]
  );

  const navItems = [
    { name: "Home", href: "/portal/dashboard", icon: LayoutDashboard, badge: 0 },
    { name: "Booking", href: "/portal/appointments", icon: CalendarDays, badge: 0 },
    { name: "Wellness", href: "/portal/wellness", icon: Heart, badge: 0 },
    { name: "Chat", href: "/portal/messages", icon: MessageSquare, badge: unreadMessagesCount },
  ];

  const moreItems = [
    { name: "Dental Chart", href: "/portal/chart", icon: ClipboardList },
    { name: "History", href: "/portal/treatments", icon: History },
    { name: "Prescriptions", href: "/portal/prescriptions", icon: FileText },
    { name: "Billing", href: "/portal/invoices", icon: Receipt },
    { name: "My Files", href: "/portal/files", icon: FolderOpen },
    { name: "Products", href: "/portal/products", icon: ShoppingBag },
    { name: "My Orders", href: "/portal/orders", icon: PackageCheck },
    { name: "AI Assistant", href: "/portal/ai", icon: Bot },
    { name: "Notifications", href: "/portal/notifications", icon: Activity },
    { name: "Profile", href: "/portal/profile", icon: UserCircle },
  ];

  const quickActions = [
    { label: "Book Appointment", icon: CalendarPlus, href: "/portal/appointments", color: "text-blue-600 bg-blue-50" },
    { label: "Pay Invoice", icon: FileText, href: "/portal/invoices", color: "text-emerald-600 bg-emerald-50" },
    { label: "Ask AI", icon: Bot, href: "/portal/ai", color: "text-purple-600 bg-purple-50" },
  ];

  if (!user) return null;

  return (
    <>
      {/* ── Bottom Sheet Overlay ── */}
      {isMoreOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 xl:hidden transition-opacity duration-300"
          onClick={() => setIsMoreOpen(false)}
        />
      )}

      {/* ── Native Bottom Sheet ── */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-[20px] shadow-2xl z-[60] transform transition-transform duration-300 ease-out xl:hidden flex flex-col ${
          isMoreOpen ? 'translate-y-0' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
          
          {/* Profile Header */}
          <div 
            onClick={() => { setIsMoreOpen(false); router.push("/portal/profile"); }}
            className="flex items-center gap-3 p-3 mb-4 bg-gray-50 rounded-[12px] border border-gray-100 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[14px]">
              {user?.patientProfile?.firstName?.[0] || "P"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-gray-900 truncate">
                {user?.patientProfile?.firstName} {user?.patientProfile?.lastName}
              </p>
              <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>

          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 pl-1">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {quickActions.map(action => (
              <Link
                key={action.label}
                href={action.href}
                onClick={() => setIsMoreOpen(false)}
                className="flex flex-col items-center justify-start text-center gap-1.5 active:scale-95 transition-transform"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm border border-gray-100 ${action.color}`}>
                  <action.icon className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[10px] font-semibold text-gray-700 leading-tight">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="h-px bg-gray-100 my-4" />

          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 pl-1">Modules</h3>
          
          <div className="grid grid-cols-4 gap-y-4 gap-x-2 mb-6">
            {moreItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMoreOpen(false)}
                className="flex flex-col items-center justify-start text-center gap-1.5 active:opacity-70"
              >
                <div className="w-12 h-12 rounded-[12px] bg-gray-50 flex items-center justify-center text-gray-700 shadow-sm border border-gray-100">
                  <item.icon className="w-5 h-5 stroke-[1.5]" />
                </div>
                <span className="text-[10px] font-medium text-gray-600 leading-tight px-1">
                  {item.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="h-px bg-gray-100 my-4" />

          <button
            onClick={() => performLogoutTransition(router)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 text-red-600 font-semibold text-[13px] rounded-[12px] active:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4 stroke-2" />
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Fixed Bottom Navigation Bar ── */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 min-h-[64px] bg-white border-t border-gray-200 flex items-center justify-around px-2 z-40 safe-pb shadow-inner">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/portal/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMoreOpen(false)}
              className="flex flex-col items-center justify-center flex-1 h-full pt-1 relative"
            >
              <div className={`p-1.5 rounded-[12px] mb-0.5 transition-all duration-200 ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-400"}`}>
                <Icon className={`w-[20px] h-[20px] ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                {item.badge > 0 && (
                  <span className="absolute top-1.5 right-[20%] translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-[9px] font-bold px-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full ring-2 ring-white z-10">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium transition-colors ${isActive ? "text-blue-700 font-semibold" : "text-gray-500"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className="flex flex-col items-center justify-center flex-1 h-full pt-1 relative"
        >
          <div className={`p-1.5 rounded-[12px] mb-0.5 transition-all duration-200 ${isMoreOpen ? "bg-blue-50 text-blue-600" : "text-gray-400"}`}>
            <MoreHorizontal className={`w-[20px] h-[20px] ${isMoreOpen ? "stroke-[2.5]" : "stroke-2"}`} />
          </div>
          <span className={`text-[11px] font-medium transition-colors ${isMoreOpen ? "text-blue-700 font-semibold" : "text-gray-500"}`}>
            More
          </span>
        </button>
      </nav>
    </>
  );
}
