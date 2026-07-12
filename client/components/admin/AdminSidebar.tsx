"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  LayoutDashboard, Users, CalendarDays, Stethoscope, 
  CreditCard, ShoppingBag, BarChart, Bell, Settings, LogOut,
  PanelLeftClose, MessageSquare, Pill, FileText, Heart,
  Package, Truck, FileEdit, Folder, Activity, ClipboardCheck, PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function AdminSidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { performLogoutTransition, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navGroups = useMemo(() => [
    {
      title: "Workspace",
      items: [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Messages", href: "/admin/messages", icon: MessageSquare },
        { name: "Appointments", href: "/admin/appointments", icon: CalendarDays },
        { name: "Patients", href: "/admin/patients", icon: Users },
      ]
    },
    {
      title: "Clinical",
      items: [
        { name: "Workspace", href: "/admin/workspace", icon: Stethoscope },
        { name: "Prescriptions", href: "/admin/prescriptions", icon: Pill },
        { name: "Records", href: "/admin/records", icon: FileText },
        { name: "Wellness", href: "/admin/wellness", icon: Heart },
      ]
    },
    {
      title: "Files & Content",
      items: [
        { name: "File Manager", href: "/admin/files", icon: Folder },
        { name: "CMS Publishing", href: "/admin/blog", icon: FileEdit },
      ]
    },
    {
      title: "Business",
      items: [
        { name: "Billing", href: "/admin/billing", icon: CreditCard },
        { name: "Products", href: "/admin/products", icon: ShoppingBag },
        { name: "Orders", href: "/admin/orders", icon: Package },
        { name: "Suppliers", href: "/admin/suppliers", icon: Truck },
        { name: "Reports", href: "/admin/analytics", icon: BarChart },
      ]
    },
    {
      title: "System",
      items: [
        { name: "Notifications", href: "/admin/notifications", icon: Bell },
        { name: "Activity", href: "/admin/activity", icon: Activity },
        { name: "Approvals", href: "/admin/approvals", icon: ClipboardCheck },
      ]
    }
  ], []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (pathname === href) {
      e.preventDefault();
      onClose?.();
    } else {
      onClose?.();
    }
  };

  if (!mounted) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 xl:hidden transition-opacity" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed xl:relative top-0 left-0 h-screen bg-[#F7F7F8] border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out z-50 shrink-0",
        isCollapsed ? "w-[72px]" : "w-[280px]",
        isOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
      )}>
        {/* Header / Logo */}
        <div className={cn("h-14 flex items-center shrink-0 border-b border-gray-200/50", isCollapsed ? "justify-center" : "px-4 justify-between")}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 bg-black text-white rounded-[6px] flex items-center justify-center font-bold text-sm shrink-0">H</div>
            {!isCollapsed && <span className="font-semibold text-gray-900 text-sm truncate tracking-tight">HollyDental</span>}
          </div>
          {!isCollapsed && (
            <button onClick={onToggleCollapse} className="text-gray-400 hover:text-gray-900 transition-colors hidden xl:block">
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 px-2 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col">
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  {group.title}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={cn(
                        "flex items-center rounded-lg h-9 transition-colors group relative",
                        isCollapsed ? "justify-center px-0 w-10 mx-auto" : "px-3",
                        isActive ? "bg-white shadow-sm border border-gray-200/60 text-black font-medium" : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 border border-transparent"
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} strokeWidth={isActive ? 2.5 : 2} />
                      {!isCollapsed && (
                        <span className="ml-3 text-[13px] truncate">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Profile */}
        <div className="p-2 border-t border-gray-200/50 shrink-0">
          <div className={cn("flex items-center rounded-lg p-1.5 transition-colors", isCollapsed ? "justify-center" : "gap-3 hover:bg-gray-200/50")}>
            {user?.profilePicUrl ? (
              <img src={user.profilePicUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.displayName?.[0] || "A"}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-gray-900 truncate">{user?.displayName || "Admin User"}</div>
                <div className="text-[11px] text-gray-500 truncate">{user?.email}</div>
              </div>
            )}
            {!isCollapsed && (
              <div className="flex items-center shrink-0">
                <Link href="/admin/settings/my-account" className="p-1.5 text-gray-400 hover:text-gray-900 rounded-md transition-colors">
                  <Settings className="w-4 h-4" />
                </Link>
                <button onClick={() => performLogoutTransition(router)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {isCollapsed && (
            <button onClick={onToggleCollapse} className="mt-2 w-full flex justify-center p-2 text-gray-400 hover:text-gray-900 transition-colors hidden xl:flex">
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
