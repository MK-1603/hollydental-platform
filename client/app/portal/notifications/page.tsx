"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  CalendarCheck,
  ClipboardList,
  MessageSquare,
  RefreshCw,
  Activity,
  Search,
  Filter,
  CheckCircle2,
  X,
  CreditCard,
  BellRing,
  MoreHorizontal,
  MapPin,
  Clock,
  Calendar,
  Settings,
  ChevronRight,
  UserCircle2,
  ChevronDown,
  Trash2,
  Download,
  Archive,
  ArrowRight
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useLiveData } from "@/lib/useLiveData";
import React from "react";

interface NotificationItem {
  id: string;
  type: "appointment" | "prescription" | "message" | "payment" | "treatment";
  title: string;
  body: string;
  href: string;
  timestamp: string;
  read: boolean;
  doctor?: string;
}

const ICONS: Record<NotificationItem["type"], { icon: React.ReactNode, color: string, bg: string, label: string }> = {
  appointment: { icon: <CalendarCheck className="w-5 h-5 text-blue-600" />, color: "text-blue-600", bg: "bg-blue-50", label: "Appointment" },
  prescription: { icon: <ClipboardList className="w-5 h-5 text-purple-600" />, color: "text-purple-600", bg: "bg-purple-50", label: "Prescription" },
  message: { icon: <MessageSquare className="w-5 h-5 text-emerald-600" />, color: "text-emerald-600", bg: "bg-emerald-50", label: "Message" },
  payment: { icon: <CreditCard className="w-5 h-5 text-amber-600" />, color: "text-amber-600", bg: "bg-amber-50", label: "Payment" },
  treatment: { icon: <Activity className="w-5 h-5 text-orange-600" />, color: "text-orange-600", bg: "bg-orange-50", label: "Treatment" },
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDateFull(ts: string) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function groupNotifications(items: NotificationItem[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { [key: string]: NotificationItem[] } = {
    Today: [],
    Yesterday: [],
    Earlier: []
  };

  items.forEach(item => {
    const itemDate = new Date(item.timestamp);
    itemDate.setHours(0, 0, 0, 0);

    if (itemDate.getTime() === today.getTime()) {
      groups.Today.push(item);
    } else if (itemDate.getTime() === yesterday.getTime()) {
      groups.Yesterday.push(item);
    } else {
      groups.Earlier.push(item);
    }
  });

  return groups;
}
export default function PortalNotificationsPage() {
  const { data, loading, refetch } = useLiveData<NotificationItem[]>(
    "/notifications/me",
    { intervalMs: 5000 }
  );

  const items = useMemo(() => data || [], [data]);

  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<NotificationItem | null>(null);

  // New States
  const [markingRead, setMarkingRead] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pushToggles, setPushToggles] = useState({
    appointments: true,
    messages: true,
    payments: true,
    reminders: true,
    medicalRecords: true,
    system: true,
  });

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (activeTab === "Unread") filtered = filtered.filter(i => !i.read);
    if (activeTab === "Appointments") filtered = filtered.filter(i => i.type === "appointment");
    if (activeTab === "Messages") filtered = filtered.filter(i => i.type === "message");
    if (activeTab === "Payments") filtered = filtered.filter(i => i.type === "payment");

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i => i.title.toLowerCase().includes(q) || i.body.toLowerCase().includes(q));
    }
    return filtered;
  }, [items, activeTab, searchQuery]);

  const groupedItems = useMemo(() => groupNotifications(filteredItems), [filteredItems]);

  const stats = useMemo(() => {
    return {
      unread: items.filter(i => !i.read).length,
      appointments: items.filter(i => i.type === "appointment").length,
      messages: items.filter(i => i.type === "message").length,
      payments: items.filter(i => i.type === "payment").length,
      reminders: items.filter(i => i.type === "prescription").length,
      today: items.filter(i => {
        const d = new Date(i.timestamp);
        d.setHours(0, 0, 0, 0);
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return d.getTime() === t.getTime();
      }).length
    };
  }, [items]);

  const handleMarkAllRead = async () => {
    try {
      setMarkingRead(true);
      await apiRequest("/notifications/mark-all-read", { method: "POST" });
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingRead(false);
    }
  };

  useMemo(() => {
    if (filteredItems.length > 0 && !selectedItem) {
      setSelectedItem(filteredItems[0]);
    }
  }, [filteredItems, selectedItem]);

  const tabs = [
    { name: "All", count: items.length },
    { name: "Unread", count: stats.unread },
    { name: "Appointments", count: stats.appointments },
    { name: "Messages", count: stats.messages },
    { name: "Payments", count: stats.payments },
    { name: "Medical Records", count: 0 },
    { name: "System", count: 0 },
  ];

  const togglePush = (key: keyof typeof pushToggles) => {
    setPushToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="h-full flex flex-col bg-white font-sans select-none text-[#0F172A] selection:bg-[#2563EB]/20 overflow-hidden">
      <div className="flex flex-col h-full max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 xl:pt-6 pb-2">

        {/* ── Fixed Top Section ── */}
        <div className="shrink-0 bg-white pt-0 pb-1 space-y-2">

          {/* 1. Notification Header */}
          {/* 1. Notification Header */}
          <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">

            {/* Left side: Icon, Title & Stats + Mobile Actions */}
            <div className="flex items-center justify-between w-full lg:w-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-[14px] md:rounded-2xl flex items-center justify-center border border-[#0F172A]/[0.08] shadow-[0_2px_8px_rgba(15,23,42,0.04)] shrink-0">
                  <Bell className="w-5 h-5 md:w-6 md:h-6 text-[#2563EB]" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h1 className="text-[22px] lg:text-page-title font-bold text-[#0F172A] leading-tight">Notifications</h1>
                  <div className="flex items-center gap-3 text-[12px] md:text-[13px] font-medium text-[#64748B] mt-0.5 md:mt-1">
                    <p className="hidden md:block">Stay updated with appointments, messages and clinic updates.</p>
                    <span className="hidden md:inline-block w-1 h-1 rounded-full bg-gray-300"></span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#2563EB]"></div> <span className="hidden sm:inline">Unread:</span><span className="sm:hidden">New:</span> <b className="text-[#0F172A]">{stats.unread}</b></span>
                      <span className="flex items-center gap-1.5 ml-1 md:ml-2"><div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500"></div> <span className="hidden sm:inline">Today:</span><span className="sm:hidden">Tdy:</span> <b className="text-[#0F172A]">{stats.today}</b></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Actions (inline on right) */}
              <div className="flex lg:hidden items-center gap-2 shrink-0 ml-2">
                <button onClick={handleMarkAllRead} disabled={markingRead} className="flex bg-white border border-[#0F172A]/[0.08] text-[#0F172A] w-9 h-9 rounded-[10px] items-center justify-center shadow-[0_2px_8px_rgba(15,23,42,0.04)] active:scale-95 disabled:opacity-50">
                  <CheckCircle2 className={`w-4 h-4 text-gray-500 ${markingRead ? 'animate-pulse' : ''}`} />
                </button>
                <div className="relative">
                  <button onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} className="flex bg-white border border-[#0F172A]/[0.08] text-[#0F172A] w-9 h-9 rounded-[10px] items-center justify-center shadow-[0_2px_8px_rgba(15,23,42,0.04)] active:scale-95">
                    <MoreHorizontal className="w-4 h-4 text-gray-600" />
                  </button>
                  {/* More Menu Content */}
                  {isMoreMenuOpen && (
                    <div className="absolute right-0 top-12 w-[280px] bg-white border border-[#0F172A]/[0.06] shadow-[0_16px_40px_rgba(15,23,42,0.1)] rounded-[20px] p-5 z-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <BellRing className="w-4 h-4 text-[#2563EB]" />
                          <h4 className="text-[14px] font-bold text-[#0F172A]">Push Notifications</h4>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Enabled</span>
                      </div>
                      <div className="space-y-4 mb-5">
                        {[
                          { key: "appointments", icon: CalendarCheck, label: "Appointments" },
                          { key: "messages", icon: MessageSquare, label: "Messages" },
                          { key: "payments", icon: CreditCard, label: "Payments" },
                          { key: "reminders", icon: BellRing, label: "Reminders" },
                          { key: "medicalRecords", icon: ClipboardList, label: "Medical Records" },
                          { key: "system", icon: Settings, label: "System" },
                        ].map((channel) => (
                          <div key={channel.key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <channel.icon className="w-4 h-4 text-[#64748B]" />
                              <span className="text-[13px] font-medium text-[#0F172A]">{channel.label}</span>
                            </div>
                            <button onClick={() => togglePush(channel.key as keyof typeof pushToggles)} className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${pushToggles[channel.key as keyof typeof pushToggles] ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-300 shadow-sm ${pushToggles[channel.key as keyof typeof pushToggles] ? 'left-[18px]' : 'left-[3px]'}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-[#0F172A] border border-gray-200 py-2.5 rounded-[12px] text-[12px] font-bold transition-all shadow-sm">
                        <Settings className="w-3.5 h-3.5 text-gray-500" /> Manage Settings
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-[12px] border border-emerald-100 shadow-sm mr-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-emerald-700 leading-none mb-0.5">Live Sync</span>
                  <span className="text-[9px] font-semibold text-emerald-600/70 uppercase tracking-wider">Connected</span>
                </div>
              </div>

              <button onClick={handleMarkAllRead} disabled={markingRead} className="flex bg-white border border-[#0F172A]/[0.08] hover:bg-gray-50 text-[#0F172A] w-12 h-12 rounded-[16px] items-center justify-center shadow-[0_2px_8px_rgba(15,23,42,0.04)] shrink-0 transition-all active:scale-95 disabled:opacity-50" title="Mark all as read">
                <CheckCircle2 className={`w-5 h-5 text-gray-500 ${markingRead ? 'animate-pulse' : ''}`} />
              </button>
              <button onClick={refetch} className="bg-white border border-[#0F172A]/[0.08] hover:bg-gray-50 text-[#0F172A] w-12 h-12 rounded-[16px] flex items-center justify-center shadow-[0_2px_8px_rgba(15,23,42,0.04)] shrink-0 transition-all active:scale-95" title="Refresh">
                <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin text-[#2563EB]' : ''}`} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="bg-white border border-[#0F172A]/[0.08] hover:bg-gray-50 text-[#0F172A] w-12 h-12 rounded-[16px] flex items-center justify-center shadow-[0_2px_8px_rgba(15,23,42,0.04)] shrink-0 transition-all active:scale-95"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-600" />
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute right-0 top-14 w-[280px] bg-white border border-[#0F172A]/[0.06] shadow-[0_16px_40px_rgba(15,23,42,0.1)] rounded-[20px] p-5 z-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <BellRing className="w-4 h-4 text-[#2563EB]" />
                        <h4 className="text-[14px] font-bold text-[#0F172A]">Push Notifications</h4>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">Enabled</span>
                    </div>

                    <div className="space-y-4 mb-5">
                      {[
                        { key: "appointments", icon: CalendarCheck, label: "Appointments" },
                        { key: "messages", icon: MessageSquare, label: "Messages" },
                        { key: "payments", icon: CreditCard, label: "Payments" },
                        { key: "reminders", icon: BellRing, label: "Reminders" },
                        { key: "medicalRecords", icon: ClipboardList, label: "Medical Records" },
                        { key: "system", icon: Settings, label: "System" },
                      ].map((channel) => (
                        <div key={channel.key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <channel.icon className="w-4 h-4 text-[#64748B]" />
                            <span className="text-[13px] font-medium text-[#0F172A]">{channel.label}</span>
                          </div>
                          <button
                            onClick={() => togglePush(channel.key as keyof typeof pushToggles)}
                            className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${pushToggles[channel.key as keyof typeof pushToggles] ? 'bg-emerald-500' : 'bg-gray-200'}`}
                          >
                            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-300 shadow-sm ${pushToggles[channel.key as keyof typeof pushToggles] ? 'left-[18px]' : 'left-[3px]'}`} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-[#0F172A] border border-gray-200 py-2.5 rounded-[12px] text-[12px] font-bold transition-all shadow-sm">
                      <Settings className="w-3.5 h-3.5 text-gray-500" /> Manage Settings
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* 3. Toolbar (Search + Filter Dropdown) */}
          <div className="flex flex-row items-center gap-2 md:gap-3 py-2 w-full">

            {/* Large Search Bar */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-white border border-[#0F172A]/[0.08] shadow-[0_2px_8px_rgba(15,23,42,0.04)] rounded-full pl-9 md:pl-10 pr-3 md:pr-4 py-2.5 text-[13px] font-medium text-[#0F172A] outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-gray-400 truncate"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative shrink-0 z-40">
              <button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 bg-white border border-[#0F172A]/[0.08] rounded-full font-bold text-[13px] text-[#0F172A] shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:bg-gray-50 transition-all whitespace-nowrap"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#2563EB]" />
                  {activeTab}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute right-0 top-12 w-[220px] bg-white border border-[#0F172A]/[0.08] shadow-[0_16px_40px_rgba(15,23,42,0.12)] rounded-[16px] p-2 z-50">
                  {tabs.map((tab) => (
                    <button
                      key={tab.name}
                      onClick={() => {
                        setActiveTab(tab.name);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-left text-[13px] font-semibold transition-colors ${activeTab === tab.name ? "bg-blue-50 text-[#2563EB]" : "text-[#0F172A] hover:bg-gray-50"
                        }`}
                    >
                      {tab.name}
                      {tab.count > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === tab.name ? 'bg-blue-100 text-[#2563EB]' : 'bg-gray-100 text-[#64748B]'}`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* ── 4. Main Split Layout ── */}
        <div className="flex flex-col lg:flex-row gap-8 mt-2 flex-1 overflow-hidden">

          {/* Main Feed Column */}
          <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden bg-white border border-[#0F172A]/[0.06] rounded-[32px] shadow-[0_4px_24px_rgba(15,23,42,0.02)]">

            {/* Timeline List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
              <div className="space-y-10">
                {Object.entries(groupedItems).map(([groupName, groupItems]) => {
                  if (groupItems.length === 0) return null;
                  return (
                    <div key={groupName}>
                      <h4 className="text-[14px] font-bold text-[#0F172A] mb-4 flex items-center gap-3">
                        {groupName}
                        <span className="h-px bg-gray-200 flex-1"></span>
                      </h4>
                      <div className="space-y-3">
                        {groupItems.map(item => {
                          const isSelected = selectedItem?.id === item.id;
                          const iconData = ICONS[item.type];
                          const isChecked = selectedIds.has(item.id);

                          return (
                            <div
                              key={item.id}
                              onClick={() => setSelectedItem(item)}
                              className="group relative flex flex-col sm:flex-row items-start gap-4 py-5 sm:py-6 border-b border-gray-100 last:border-0 cursor-pointer transition-colors duration-200 hover:bg-gray-50/30 -mx-6 px-6 lg:-mx-8 lg:px-8"
                            >

                              {/* Mobile Top Row: Icon + Label + Menu */}
                              <div className="flex items-center justify-between w-full sm:hidden mb-2">
                                <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 border border-white shadow-sm ${iconData.bg}`}>
                                    {React.cloneElement(iconData.icon as React.ReactElement<any>, { className: "w-5 h-5" })}
                                  </div>
                                  <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-lg tracking-wider uppercase ${iconData.bg} ${iconData.color}`}>
                                    {iconData.label}
                                  </span>
                                </div>
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownId(activeDropdownId === item.id ? null : item.id);
                                    }}
                                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500"
                                  >
                                    <MoreHorizontal className="w-5 h-5" />
                                  </button>
                                  {activeDropdownId === item.id && (
                                    <div
                                      className="absolute right-0 top-10 w-48 bg-white rounded-[16px] shadow-[0_16px_40px_rgba(15,23,42,0.12)] border border-[#0F172A]/[0.06] z-50 p-1.5"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={() => setActiveDropdownId(null)}
                                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-[10px] text-[13px] text-[#0F172A] font-bold flex items-center gap-2 transition-colors"
                                      >
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mark as read
                                      </button>
                                      <button
                                        onClick={() => setActiveDropdownId(null)}
                                        className="w-full text-left px-3 py-2.5 hover:bg-red-50 rounded-[10px] text-[13px] text-red-600 font-bold flex items-center gap-2 transition-colors mt-0.5"
                                      >
                                        <Trash2 className="w-4 h-4" /> Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Desktop Icon (hidden on mobile) */}
                              <div className={`hidden sm:flex w-14 h-14 rounded-[20px] items-center justify-center shrink-0 border border-white shadow-sm ${iconData.bg}`}>
                                {React.cloneElement(iconData.icon as React.ReactElement<any>, { className: "w-6 h-6" })}
                              </div>

                              <div className="flex-1 min-w-0 w-full sm:pt-1">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                  <h5 className={`text-[16px] text-[#0F172A] leading-tight flex items-center gap-2 ${!item.read ? 'font-bold' : 'font-semibold'}`}>
                                    {item.title}
                                    {!item.read && <div className="hidden sm:block w-2 h-2 rounded-full bg-[#2563EB]" />}
                                  </h5>
                                  <div className="hidden sm:flex items-center gap-4">
                                    <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-lg tracking-wider uppercase shadow-sm border border-white ${iconData.bg} ${iconData.color}`}>
                                      {iconData.label}
                                    </span>
                                    <div className="relative">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveDropdownId(activeDropdownId === item.id ? null : item.id);
                                        }}
                                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity -mr-2"
                                      >
                                        <MoreHorizontal className="w-5 h-5" />
                                      </button>
                                      {activeDropdownId === item.id && (
                                        <div
                                          className="absolute right-0 top-10 w-48 bg-white rounded-[16px] shadow-[0_16px_40px_rgba(15,23,42,0.12)] border border-[#0F172A]/[0.06] z-50 p-1.5"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <button
                                            onClick={() => setActiveDropdownId(null)}
                                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-[10px] text-[13px] text-[#0F172A] font-bold flex items-center gap-2 transition-colors"
                                          >
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mark as read
                                          </button>
                                          <button
                                            onClick={() => setActiveDropdownId(null)}
                                            className="w-full text-left px-3 py-2.5 hover:bg-red-50 rounded-[10px] text-[13px] text-red-600 font-bold flex items-center gap-2 transition-colors mt-0.5"
                                          >
                                            <Trash2 className="w-4 h-4" /> Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <p className="text-[14px] text-[#475569] line-clamp-2 sm:line-clamp-1 mb-4 font-medium sm:pr-12 leading-relaxed">{item.body}</p>

                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-medium text-[#64748B]">
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-[#94A3B8]" /> {formatTime(item.timestamp)}
                                  </span>
                                  {item.doctor && (
                                    <span className="flex items-center gap-1.5">
                                      <UserCircle2 className="w-4 h-4 text-[#94A3B8]" /> {item.doctor}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {filteredItems.length === 0 && (
                  <div className="relative flex-1 h-full min-h-[500px] w-full text-center flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white pointer-events-none"></div>
                    <div className="w-24 h-24 bg-gradient-to-tr from-blue-50 to-indigo-50/50 rounded-full flex items-center justify-center mb-6 relative shadow-sm border border-blue-100/50 shrink-0">
                      <CheckCircle2 className="w-10 h-10 text-[#2563EB]" />
                      <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-emerald-400 rounded-full border-[2.5px] border-white shadow-sm"></div>
                    </div>
                    <h3 className="text-[24px] font-bold text-[#0F172A] mb-3 relative">You're all caught up</h3>
                    <p className="text-[15px] font-medium text-[#64748B] max-w-sm mx-auto mb-6 leading-relaxed relative text-balance">
                      We'll notify you instantly whenever appointments, invoices or clinic updates become available.
                    </p>
                    <div className="flex items-center gap-4">
                      <button onClick={refetch} className="px-6 py-2.5 bg-[#2563EB] text-white rounded-full text-[14px] font-bold shadow-md shadow-blue-500/20 hover:bg-[#1D4ED8] transition-colors whitespace-nowrap">
                        Refresh Inbox
                      </button>
                      <button className="px-6 py-2.5 bg-white border border-gray-200 text-[#0F172A] rounded-full text-[14px] font-bold hover:bg-gray-50 transition-colors whitespace-nowrap">
                        Notification Settings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination (Fixed at bottom) */}
            {filteredItems.length > 0 && (
              <div className="shrink-0 flex items-center justify-between p-4 lg:px-8 border-t border-gray-100 bg-white">
                <span className="text-[13px] font-medium text-[#64748B]">Showing 1 to {filteredItems.length} of {filteredItems.length} notifications</span>
                <div className="flex items-center gap-1">
                  <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-[#0F172A] transition-colors"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                  <button className="w-9 h-9 rounded-xl border border-[#2563EB] bg-[#2563EB] flex items-center justify-center text-white font-bold text-[13px] shadow-sm">1</button>
                  <button className="w-9 h-9 rounded-xl border border-transparent hover:bg-gray-50 flex items-center justify-center text-[#64748B] font-bold text-[13px] transition-colors">2</button>
                  <button className="w-9 h-9 rounded-xl border border-transparent hover:bg-gray-50 flex items-center justify-center text-[#64748B] font-bold text-[13px] transition-colors">3</button>
                  <span className="px-2 text-gray-400">...</span>
                  <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-[#0F172A] transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
