"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import { 
  Search, Bell, Check, Trash2, Calendar, CreditCard, Stethoscope, 
  Archive, AlertCircle, Package, Activity, MoreVertical, RefreshCw, Pin, Copy
} from "lucide-react";
import { useDialog } from "@/components/DialogProvider";
import { cn } from "@/lib/utils";
import { isToday, isYesterday, isThisWeek, parseISO, format } from "date-fns";

// Helper for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm } = useDialog();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/notifications?filter=${filter}&search=${debouncedSearch}`);
      setNotifications(res);
    } catch (e) {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter, debouncedSearch]);

  // Server-Sent Events for Real-time with Reconnection
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("connecting");
  
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout;
    let backoff = 2000;
    const maxBackoff = 30000;
    let isComponentMounted = true;

    const connect = () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      es = new EventSource(`${baseUrl}/notifications/stream`, { withCredentials: true });
      
      es.onopen = () => {
        if (!isComponentMounted) return;
        setConnectionState("connected");
        backoff = 2000; // Reset backoff on successful connection
      };

      es.onmessage = (event) => {
        if (!isComponentMounted) return;
        const payload = JSON.parse(event.data);
        if (payload.message === "SSE connected") return;
        fetchNotifications();
      };

      es.addEventListener('update', () => {
        if (!isComponentMounted) return;
        fetchNotifications();
      });

      es.onerror = (err) => {
        if (!isComponentMounted) return;
        if (process.env.NODE_ENV === "development") {
          console.error("SSE Error:", err);
        }
        
        setConnectionState("disconnected");
        es?.close();
        
        // Exponential backoff reconnect
        reconnectTimer = setTimeout(() => {
          connect();
        }, backoff);
        
        backoff = Math.min(backoff * 1.5, maxBackoff);
      };
    };

    connect();

    return () => {
      isComponentMounted = false;
      clearTimeout(reconnectTimer);
      if (es) {
        es.close();
      }
    };
  }, []);

  // Calculate summaries
  const summary = useMemo(() => {
    return {
      unread: notifications.filter((n) => !n.isRead).length,
      appointments: notifications.filter((n) => n.type === "appointment").length,
      clinical: notifications.filter((n) => n.type === "clinical").length,
      billing: notifications.filter((n) => n.type === "billing").length,
      system: notifications.filter((n) => n.type === "system").length,
      inventory: notifications.filter((n) => n.type === "inventory").length,
    };
  }, [notifications]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
    } catch (e) {
      toast.error("Failed to mark as read");
      fetchNotifications(); // Revert
    }
  };

  const handleArchive = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await apiRequest(`/notifications/${id}/archive`, { method: "PATCH" });
      toast.success("Notification archived");
    } catch (e) {
      toast.error("Failed to archive notification");
      fetchNotifications(); // Revert
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await apiRequest(`/notifications/mark-all-read`, { method: "POST" });
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error("Failed to mark all as read");
      fetchNotifications();
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveDropdown(null);
    const isConfirmed = await confirm({
      title: "Delete Notification",
      description: "Permanently delete this notification? This cannot be undone.",
      type: "danger"
    });
    if (!isConfirmed) return;
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await apiRequest(`/notifications/${id}`, { method: "DELETE" });
      toast.success("Notification deleted");
    } catch (e) {
      toast.error("Failed to delete notification");
      fetchNotifications();
    }
  };

  const handleCopyLink = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/admin/notifications?id=${id}`);
    toast.success("Link copied to clipboard");
    setActiveDropdown(null);
  };

  const getCategoryConfig = (type: string) => {
    switch (type) {
      case "appointment": return { color: "text-blue-600", bg: "bg-blue-50", icon: Calendar };
      case "clinical": return { color: "text-purple-600", bg: "bg-purple-50", icon: Stethoscope };
      case "billing": return { color: "text-orange-600", bg: "bg-orange-50", icon: CreditCard };
      case "inventory": return { color: "text-emerald-600", bg: "bg-emerald-50", icon: Package };
      case "system": return { color: "text-gray-600", bg: "bg-gray-100", icon: AlertCircle };
      case "emergency": return { color: "text-red-600", bg: "bg-red-50", icon: Activity };
      default: return { color: "text-gray-600", bg: "bg-gray-100", icon: Bell };
    }
  };

  // Group notifications into Timeline
  const groupedNotifications = useMemo(() => {
    const groups = {
      Today: [] as any[],
      Yesterday: [] as any[],
      'This Week': [] as any[],
      Earlier: [] as any[],
    };

    notifications.forEach(n => {
      const date = new Date(n.createdAt);
      if (isToday(date)) groups.Today.push(n);
      else if (isYesterday(date)) groups.Yesterday.push(n);
      else if (isThisWeek(date)) groups['This Week'].push(n);
      else groups.Earlier.push(n);
    });

    return groups;
  }, [notifications]);

  const tabs = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "read", label: "Read" },
    { id: "archived", label: "Archived" },
    { id: "appointment", label: "Appointments" },
    { id: "billing", label: "Billing" },
    { id: "clinical", label: "Clinical" },
    { id: "inventory", label: "Inventory" },
    { id: "system", label: "System" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden font-inter">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-6 border-b border-gray-200 bg-white shrink-0 z-40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[18px] md:text-[20px] font-bold text-gray-900 font-serif truncate">Notifications</h1>
            {connectionState === "connecting" && <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-bold tracking-wide bg-amber-50 text-amber-700 border border-amber-200">Connecting...</span>}
            {connectionState === "disconnected" && <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-bold tracking-wide bg-red-50 text-red-700 border border-red-200">Reconnecting...</span>}
          </div>
          <p className="text-[12px] md:text-[13px] text-gray-500 mt-0.5 truncate hidden sm:block">System alerts, appointments, billing and clinical updates.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-[8px] pl-9 pr-4 py-2 text-[13px] focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" 
            />
          </div>

          <button onClick={() => fetchNotifications()} className="h-[36px] w-[36px] bg-white border border-gray-200 rounded-[8px] hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center shadow-sm shrink-0" title="Refresh">
            <RefreshCw className={cn("w-4 h-4 text-gray-600", loading && "animate-spin")} />
          </button>
          
          <button onClick={handleMarkAllRead} className="h-[36px] px-4 bg-white border border-gray-200 text-gray-700 text-[12px] font-bold rounded-[8px] hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm shrink-0">
            <Check className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Mark all read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 md:px-6 pt-4 pb-2 bg-[#F8FAFC] shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
          {tabs.map(tab => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "px-4 py-1.5 text-[12px] font-bold rounded-full transition-all whitespace-nowrap border shadow-sm",
                  isActive 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto w-full p-4 md:p-6 custom-scrollbar">
        {/* Timeline Rows */}
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
          {loading && notifications.length === 0 ? (
             <div className="p-12 flex justify-center"><div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div></div>
          ) : notifications.length === 0 ? (
             <div className="py-24 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-blue-50/50 border border-blue-100 flex items-center justify-center mb-4">
                   <Check className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-[16px] font-bold text-gray-900 tracking-tight">You're all caught up.</h3>
                <p className="text-[13px] text-gray-500 mt-1 max-w-[250px]">No new notifications. Take a breath and relax.</p>
                <div className="flex items-center gap-3 mt-6">
                  <button onClick={() => fetchNotifications()} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-[12px] font-bold rounded-[8px] hover:bg-gray-50 shadow-sm transition-colors">Refresh</button>
                </div>
             </div>
          ) : (
            <div className="flex flex-col">
              {Object.entries(groupedNotifications).map(([groupName, items]) => {
                if (items.length === 0) return null;
                return (
                  <div key={groupName} className="flex flex-col">
                    <div className="px-5 py-2 bg-gray-50/80 border-y border-gray-100 text-[12px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
                      {groupName}
                    </div>
                    <div className="flex flex-col">
                      {items.map((notification, index) => {
                        const config = getCategoryConfig(notification.type);
                        const Icon = config.icon;
                        const isUnread = !notification.isRead;
                        
                        return (
                          <div 
                            key={notification.id} 
                            onClick={() => {
                              if (isUnread) handleMarkAsRead(notification.id);
                            }}
                            className={cn(
                              "group relative flex items-center gap-4 px-4 md:px-6 py-4 transition-all hover:bg-slate-50 cursor-pointer border-b border-gray-100 last:border-b-0",
                              isUnread ? "bg-[#F8FAFC]" : "bg-white"
                            )}
                          >
                            {/* Left Blue Indicator */}
                            {isUnread && <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-blue-600" />}

                            {/* Unread Dot (Mobile friendly) */}
                            <div className="hidden sm:flex w-2 justify-center shrink-0">
                              {isUnread ? <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" /> : <div className="w-2" />}
                            </div>

                            {/* Colored Icon */}
                            <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-[12px] md:rounded-[14px] flex items-center justify-center shrink-0 shadow-sm border border-white", config.bg)}>
                              <Icon className={cn("w-5 h-5 md:w-6 md:h-6", config.color)} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pr-2 md:pr-4 flex flex-col justify-center">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h4 className={cn("text-[14px] md:text-[15px] truncate", isUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700")}>
                                  {notification.title}
                                </h4>
                                <span className="text-[11px] md:text-[12px] text-gray-400 font-medium whitespace-nowrap shrink-0 sm:hidden">
                                  {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[13px] md:text-[14px] text-gray-500 line-clamp-2 md:line-clamp-1 leading-snug">{notification.message}</p>
                              
                              {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  {Object.entries(notification.metadata).map(([key, value]) => (
                                    <span key={key} className="inline-flex items-center px-2 py-1 rounded-[6px] text-[10px] md:text-[11px] font-bold bg-white border border-gray-200 text-gray-600 uppercase tracking-wider shadow-sm">
                                      {key}: {String(value)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Right Actions & Timestamp */}
                            <div className="flex items-center gap-4 shrink-0">
                              
                              {/* Hover Actions */}
                              <div className="hidden group-hover:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isUnread && (
                                  <button onClick={(e) => handleMarkAsRead(notification.id, e)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-[6px] transition-colors" title="Mark Read">
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                                <button onClick={(e) => handleArchive(notification.id, e)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-[6px] transition-colors" title="Archive">
                                  <Archive className="w-4 h-4" />
                                </button>
                              </div>

                              <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap w-16 text-right group-hover:hidden md:group-hover:block">
                                {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>

                              {/* More Menu */}
                              <div className="relative">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(activeDropdown === notification.id ? null : notification.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-900 rounded-[6px] transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {activeDropdown === notification.id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-50 py-1 overflow-hidden" onClick={e => e.stopPropagation()}>
                                    <button className="w-full px-4 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                      <AlertCircle className="w-4 h-4 text-gray-400" /> Open Details
                                    </button>
                                    {isUnread && (
                                      <button onClick={(e) => handleMarkAsRead(notification.id, e)} className="w-full px-4 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                        <Check className="w-4 h-4 text-gray-400" /> Mark as Read
                                      </button>
                                    )}
                                    <button onClick={(e) => handleArchive(notification.id, e)} className="w-full px-4 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                      <Archive className="w-4 h-4 text-gray-400" /> Archive
                                    </button>
                                    <button className="w-full px-4 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                      <Pin className="w-4 h-4 text-gray-400" /> Pin
                                    </button>
                                    <div className="h-[1px] bg-gray-100 my-1" />
                                    <button onClick={(e) => handleCopyLink(notification.id, e)} className="w-full px-4 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                      <Copy className="w-4 h-4 text-gray-400" /> Copy Link
                                    </button>
                                    <button onClick={(e) => handleDelete(notification.id, e)} className="w-full px-4 py-2 text-left text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2">
                                      <Trash2 className="w-4 h-4 text-red-500" /> Delete
                                    </button>
                                  </div>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
