"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Calendar, Bell, MoreHorizontal, Activity, FileText, CreditCard, DollarSign, Package, ShoppingCart, Tags, BarChart, MessagesSquare, Settings, User, LogOut, ChevronRight, UserPlus, CalendarPlus, Pill } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useLiveData } from "@/lib/useLiveData";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, performLogoutTransition } = useAuthStore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Live Data for Badges
  const { data: appointments = [] } = useLiveData<any[]>("/appointments", { intervalMs: 30000, initialData: [] });
  const { data: messages = [] } = useLiveData<any[]>("/messages", { intervalMs: 30000, initialData: [] });
  // Add patients endpoint for new registrations badge (mocking logic here as new patients today)
  const { data: patients = [] } = useLiveData<any[]>("/patients", { intervalMs: 60000, initialData: [] });

  const pendingAppts = Array.isArray(appointments) ? appointments.filter(a => a.status === "pending").length : 0;
  const unreadMsgs = Array.isArray(messages) ? messages.reduce((acc, t) => acc + (t.unreadFromPatient || 0), 0) : 0;
  
  // New patients today
  const today = new Date().toISOString().split('T')[0];
  const newPatients = Array.isArray(patients) ? patients.filter(p => p.createdAt && p.createdAt.startsWith(today)).length : 0;

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, badge: 0 },
    { name: "Patients", href: "/admin/patients", icon: Users, badge: newPatients },
    { name: "Schedule", href: "/admin/appointments", icon: Calendar, badge: pendingAppts },
    { name: "Alerts", href: "/admin/notifications", icon: Bell, badge: unreadMsgs },
  ];

  const moreItems = [
    { name: "Clinical Workspace", href: "/admin/workspace", icon: Activity },
    { name: "Medical Records", href: "/admin/records", icon: FileText },
    { name: "Billing", href: "/admin/billing", icon: FileText },
    { name: "Payments", href: "/admin/payments", icon: DollarSign },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Products", href: "/admin/products", icon: Tags },
    { name: "Suppliers", href: "/admin/suppliers", icon: Package },
    { name: "Reports", href: "/admin/reports", icon: BarChart },
    { name: "Messages", href: "/admin/messages", icon: MessagesSquare },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const quickActions = [
    { label: "New Patient", icon: UserPlus, href: "/admin/patients?new=true", color: "text-blue-600 bg-blue-50" },
    { label: "Appointment", icon: CalendarPlus, href: "/admin/appointments?new=true", color: "text-purple-600 bg-purple-50" },
    { label: "Invoice", icon: FileText, href: "/admin/billing?new=true", color: "text-emerald-600 bg-emerald-50" },
    { label: "Prescription", icon: Pill, href: "/admin/workspace?tool=prescription", color: "text-orange-600 bg-orange-50" },
    { label: "Product", icon: Package, href: "/admin/products?new=true", color: "text-cyan-600 bg-cyan-50" },
    { label: "Clinical Note", icon: Activity, href: "/admin/workspace", color: "text-rose-600 bg-rose-50" },
  ];

  return (
    <>
      {/* ── Bottom Sheet Overlay ── */}
      {isMoreOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 md:hidden transition-opacity duration-300"
          onClick={() => setIsMoreOpen(false)}
        />
      )}

      {/* ── Native Bottom Sheet ── */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-[20px] shadow-2xl z-[60] transform transition-transform duration-300 ease-out md:hidden flex flex-col ${
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
            onClick={() => { setIsMoreOpen(false); router.push("/admin/settings"); }}
            className="flex items-center gap-3 p-3 mb-4 bg-gray-50 rounded-[12px] border border-gray-100 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[14px]">
              {user?.email?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-gray-900 truncate">{user?.displayName || "Admin User"}</p>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 min-h-[64px] bg-white border-t border-gray-200 flex items-center justify-around px-2 z-40 safe-pb">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
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
