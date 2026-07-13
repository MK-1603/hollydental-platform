"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  LayoutDashboard, Users, CalendarDays, Stethoscope, 
  CreditCard, ShoppingBag, BarChart, Bell, Settings, LogOut,
  PanelLeftClose, MessageSquare, Pill, FileText, Heart,
  Package, Truck, FileEdit, Folder, Activity, ClipboardCheck, PanelLeftOpen, Menu
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
        { name: "Settings", href: "/admin/settings", icon: Settings },
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
        "fixed xl:relative top-0 left-0 h-screen bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out z-50 shrink-0",
        isCollapsed ? "w-[80px]" : "w-[280px]",
        isOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
      )}>
        {/* Header / Logo */}
        <div className={cn("flex items-center shrink-0 mb-6 mt-6", isCollapsed ? "justify-center" : "px-6 justify-between")}>
          <div className={cn("flex items-center overflow-hidden transition-all", isCollapsed ? "w-0 opacity-0 hidden" : "gap-3")}>
            <div className="relative shrink-0 flex items-center justify-center w-8 h-8">
              <img src="/logo-mark.png" alt="Hollyhill Dental" className="w-full h-full object-contain drop-shadow-sm" draggable={false} />
            </div>
            <span className="font-sans font-bold tracking-tight text-navy text-[16px] truncate whitespace-nowrap leading-none">
              Hollyhill <span className="text-[#009BDE]">Dental</span>
            </span>
          </div>
          <button onClick={onToggleCollapse} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none" aria-label="Toggle Sidebar">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Nav */}
        <div className={cn("flex-1 overflow-y-auto custom-scrollbar space-y-6 mb-4", isCollapsed ? "px-2" : "px-4")}>
          {navGroups.map((group, idx) => (
            <div key={idx} className="flex flex-col">
              {!isCollapsed && (
                <div className="px-4 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map(item => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={cn(
                        "relative flex items-center transition-all overflow-hidden group tracking-wide",
                        isCollapsed ? "justify-center px-0 w-12 h-12 mx-auto rounded-xl" : "gap-4 px-4 py-3 rounded-2xl text-[13.5px]",
                        isActive 
                          ? "text-[#009BDE] bg-[#F7FCFF] before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-[#009BDE] before:rounded-r-full font-semibold" 
                          : "text-[#1C3B5E] hover:text-[#009BDE] hover:bg-[#FAFDFF] font-medium"
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon 
                        className={cn("shrink-0", isCollapsed ? "w-[22px] h-[22px]" : "w-[18px] h-[18px]", isActive ? "text-[#009BDE]" : "text-[#4A6482] group-hover:text-[#009BDE]")} 
                        strokeWidth={2.2} 
                      />
                      {!isCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Profile */}
        <div className={cn("mt-auto shrink-0 flex flex-col gap-4 pb-6 pt-4", isCollapsed ? "px-2" : "px-6")}>
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
            <div className={cn(
              "rounded-full bg-[#EAF6FD] border border-[#DDF0FB] flex items-center justify-center font-bold text-[#009BDE] shadow-sm shrink-0",
              isCollapsed ? "w-12 h-12 text-lg" : "w-10 h-10 text-sm"
            )}>
              {user?.displayName?.[0] || "A"}
            </div>
            {!isCollapsed && (
              <div className="truncate flex-1 min-w-0">
                <span className="block text-[13px] font-bold text-navy truncate tracking-wide">
                  {user?.displayName || "Admin User"}
                </span>
                <span className="inline-block bg-[#EAF6FD] text-[#009BDE] text-[9px] font-bold px-2.5 py-0.5 rounded-full mt-0.5 tracking-wider uppercase">
                  Doctor
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => performLogoutTransition(router)}
            className={cn(
              "flex items-center transition-colors focus:outline-none",
              isCollapsed 
                ? "justify-center mx-auto w-12 h-12 rounded-xl text-[#EF4444] hover:bg-red-50/50" 
                : "w-full gap-3.5 px-4 py-3 rounded-2xl text-[13.5px] font-semibold text-[#EF4444] hover:bg-red-50/50"
            )}
          >
            <LogOut strokeWidth={2.2} className="w-[18px] h-[18px] text-[#EF4444] shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>


        </div>
      </aside>
    </>
  );
}
