"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Building2, Users, Shield, Bell, Settings2, ShieldCheck, Database, Sliders, Server, HardDrive, Brush
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/admin/settings/general", label: "General", icon: Building2 },
    { href: "/admin/settings/my-account", label: "My Account", icon: Users },
    { href: "/admin/settings/doctors", label: "Doctors", icon: Users },
    { href: "/admin/settings/team", label: "Team", icon: Users },
    { href: "/admin/settings/clinic", label: "Clinic", icon: Sliders },
    { href: "/admin/settings/appearance", label: "Appearance", icon: Brush },
    { href: "/admin/settings/notifications", label: "Notifications", icon: Bell },
    { href: "/admin/settings/security", label: "Security", icon: Shield },
    { href: "/admin/settings/backup", label: "Backup", icon: HardDrive },
    { href: "/admin/settings/system", label: "System", icon: Server },
  ];

  const isRoot = pathname === "/admin/settings";

  return (
    <div className="h-[calc(100vh-88px)] flex bg-white w-full overflow-hidden font-inter">
      {/* Desktop Sidebar / Mobile Root Nav */}
      <div className={cn(
        "w-[240px] border-r border-gray-200 bg-gray-50/30 flex-shrink-0 flex flex-col h-full",
        isRoot ? "block w-full" : "hidden lg:flex"
      )}>
        <div className="p-6 pb-4">
          <h1 className="text-[18px] font-semibold text-gray-900 tracking-tight leading-none mb-1.5">Settings</h1>
          <p className="text-[12px] text-gray-500 font-medium">Enterprise configuration</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pt-0 custom-scrollbar">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-2">Preferences</div>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-left transition-colors group",
                    isActive ? "bg-gray-200/50 text-gray-900" : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4", isActive ? "text-gray-900" : "text-gray-400")} />
                    <span className="block text-[13px] font-medium">{item.label}</span>
                  </div>
                  <div className="lg:hidden text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col h-full bg-white overflow-hidden relative",
        !isRoot ? "block" : "hidden lg:flex"
      )}>
        {!isRoot && (
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 flex items-center sticky top-0 z-30">
            <button 
              onClick={() => router.push("/admin/settings")}
              className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Settings
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
