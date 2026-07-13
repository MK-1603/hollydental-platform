"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveData } from "@/lib/useLiveData";
import { useChatThread } from "@/lib/useChatThread";
import { apiRequest } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Send, Search, RefreshCw, AlertCircle, MessageSquare, Trash2, Check, CheckCheck, Phone, MoreVertical, Smile, ChevronLeft } from "lucide-react";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface Thread {
  patientId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadFromPatient: number;
  patient?: Patient | null;
}

function normalizeThreads(raw: any): Thread[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.threads)) return raw.threads;
  return [];
}

function getInitials(p?: Patient | null) {
  return ((p?.firstName?.[0] || "") + (p?.lastName?.[0] || "")).toUpperCase() || "?";
}

function formatThreadTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - msgDay.getTime();
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 2 * 86400000) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function AdminMessagesPage() {
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"threads" | "chat">("threads");
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);

  const scrollToBottom = (smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom < 80;
    setStickToBottom(atBottom);
    if (atBottom) setUnseenCount(0);
  };

  const {
    data: threads = [],
    loading: tLoading,
    refetch: refetchThreads,
  } = useLiveData<Thread[]>("/messages", {
    intervalMs: 10000,
    select: normalizeThreads,
    initialData: [],
  });

  useEffect(() => {
    if (!activePatientId && threads.length > 0) {
      setActivePatientId(threads[0].patientId);
    }
  }, [threads, activePatientId]);

  const {
    messages,
    loading: mLoading,
    error: mError,
    refetch: refetchMessages,
    sendMessage,
    deleteMessage,
    clearChat,
    markRead,
  } = useChatThread({ patientId: activePatientId, selfRole: "admin" });

  useEffect(() => {
    setInput("");
    setSendError(null);
    setUnseenCount(0);
    setStickToBottom(true);
    requestAnimationFrame(() => scrollToBottom(false));
  }, [activePatientId]);

  const lastCountRef = useRef(0);
  useEffect(() => {
    const prev = lastCountRef.current;
    const next = messages.length;
    lastCountRef.current = next;
    if (next === 0) return;
    if (stickToBottom) {
      requestAnimationFrame(() => scrollToBottom(true));
      setUnseenCount(0);
    } else if (next > prev) {
      setUnseenCount((c) => c + (next - prev));
    }
  }, [messages.length, stickToBottom]);

  useEffect(() => {
    if (!activePatientId) return;
    markRead();
    const onFocus = () => markRead();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [activePatientId, markRead]);

  const filteredThreads = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return threads;
    return threads.filter((t) => {
      const name = `${t.patient?.firstName || ""} ${t.patient?.lastName || ""}`.toLowerCase();
      return (
        name.includes(term) ||
        t.lastMessage?.toLowerCase().includes(term) ||
        t.patient?.email?.toLowerCase().includes(term)
      );
    });
  }, [threads, search]);

  const activeThread = threads.find((t) => t.patientId === activePatientId);
  const activePatientName = activeThread?.patient
    ? `${activeThread.patient.firstName} ${activeThread.patient.lastName}`
    : "Patient";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending || !activePatientId) return;
    setSending(true);
    setSendError(null);
    try {
      await sendMessage(body);
      setInput("");
      refetchThreads();
      inputRef.current?.focus();
    } catch (err: any) {
      setSendError(err?.message || "Failed to send.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await toast.confirm({
      title: "Unsend this message?",
      message: "This message will be permanently removed for everyone.",
      confirmText: "Unsend",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteMessage(id);
      refetchThreads();
    } catch (err: any) {
      toast.error(err?.message || "Couldn't delete the message.");
    }
  };

  const handleClearChat = async () => {
    const ok = await toast.confirm({
      title: "Clear all messages?",
      message: "This will permanently delete the entire chat history for this patient.",
      confirmText: "Clear Chat",
      danger: true,
    });
    if (!ok) return;
    try {
      await clearChat();
      refetchThreads();
    } catch (err: any) {
      toast.error(err?.message || "Couldn't clear chat.");
    }
  };

  return (
    <div className="flex flex-col h-full xl:p-0">
      {/* Chat Shell — responsive: stacked on mobile, side-by-side on lg+ */}
      <div className="flex-1 min-h-0 overflow-hidden flex bg-white">
        {/* ── Left: Thread list ── */}
        <aside className={`flex-col border-r border-gray-100 bg-white h-full min-h-0 overflow-hidden flex-shrink-0 ${
          // On mobile: show threads panel only when mobileView==='threads'
          // On lg+: always show as a fixed 300px sidebar
          mobileView === "threads" ? "flex w-full" : "hidden"
        } lg:flex lg:w-[300px] lg:max-w-[300px]`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-2.5 bg-white shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy">Patient Chats</p>
              <p className="text-[9px] text-gray-400">Live Clinical Messaging</p>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 bg-[#f0f2f5] border-b border-gray-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search or start new chat"
                className="w-full bg-white border border-gray-200 rounded-full pl-9 pr-3 py-2 text-xs text-navy placeholder:text-gray-400 focus:outline-none focus:border-gold transition-colors"
              />
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {tLoading && threads.length === 0 ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full shimmer shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 shimmer rounded w-3/4" />
                      <div className="h-2 shimmer rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                <MessageSquare className="w-8 h-8 text-gray-200" />
                <p className="text-xs text-gray-400">
                  {threads.length === 0 ? "No patient messages yet." : "No matches found."}
                </p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isActive = t.patientId === activePatientId;
                const name =
                  `${t.patient?.firstName || ""} ${t.patient?.lastName || ""}`.trim() || "Patient";
                return (
                  <button
                    key={t.patientId}
                    type="button"
                    onClick={() => {
                      setActivePatientId(t.patientId);
                      setMobileView("chat");
                    }}
                    className={`group w-full text-left flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 transition-colors relative ${
                      isActive ? "bg-[#f0f2f5]" : "hover:bg-gray-50/70"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-navy text-gold flex items-center justify-center font-bold text-sm uppercase border-2 border-white shadow-sm">
                        {getInitials(t.patient)}
                      </div>
                      {t.unreadFromPatient > 0 && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-navy truncate">{name}</span>
                        <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap ml-2">
                          {formatThreadTime(t.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[11px] text-gray-500 truncate pr-2 flex-1">
                          {t.lastMessage || "No messages yet"}
                        </p>
                        {t.unreadFromPatient > 0 && (
                          <span className="text-[9px] font-bold bg-emerald-500 text-white min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shrink-0">
                            {t.unreadFromPatient}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold rounded-r-full" />
                    )}

                    {/* Delete Thread Button */}
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const ok = await toast.confirm({
                          title: "Clear all messages?",
                          message: "This will permanently delete the entire chat history for this patient.",
                          confirmText: "Clear Chat",
                          danger: true,
                        });
                        if (!ok) return;
                        try {
                          await apiRequest(`/messages/clear/${t.patientId}`, { method: "DELETE" });
                          refetchThreads();
                          if (isActive) {
                            setActivePatientId(null);
                            setMobileView("threads");
                          }
                        } catch (err: any) {
                          toast.error(err?.message || "Couldn't clear chat.");
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all focus:outline-none focus:opacity-100"
                      title="Clear Chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Right: Conversation ── */}
        <section className={`flex-col h-full min-h-0 bg-[#f0f2f5] overflow-hidden flex-1 ${
          mobileView === "chat" ? "flex" : "hidden"
        } lg:flex`}>
          {!activePatientId ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white shadow-inner flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-gold" />
                </div>
                <span className="absolute -bottom-1 -right-1 text-2xl">💬</span>
              </div>
              <div className="space-y-2 max-w-xs">
                <h3 className="font-serif text-xl font-bold text-navy">Hollyhill Clinical Chat</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Select a patient conversation from the sidebar to review the clinical thread and reply in real time.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-refreshing every 10s
              </div>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <header className="bg-[#f0f2f5] border-b border-gray-200 px-3 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Mobile back button */}
                  <button
                    type="button"
                    onClick={() => setMobileView("threads")}
                    className="lg:hidden p-1.5 rounded-full hover:bg-gray-200 text-navy transition-colors shrink-0"
                    aria-label="Back to conversations"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-navy text-gold flex items-center justify-center font-bold text-sm uppercase border-2 border-white shadow-sm shrink-0">
                    {getInitials(activeThread?.patient)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-navy truncate">{activePatientName}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] text-gray-400 font-semibold">
                        {mLoading ? "Refreshing…" : mError ? "Connection issue" : "Live · auto-refresh every 5s"}
                      </span>
                    </div>
                    {activeThread?.patient?.email && (
                      <p className="text-[9px] text-gray-400 mt-0.5 truncate">{activeThread.patient.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {activeThread?.patient?.phone && (
                    <a
                      href={`tel:${activeThread.patient.phone}`}
                      className="p-2 rounded-full hover:bg-gray-200 text-navy transition-colors"
                      title="Call patient"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => { refetchThreads(); refetchMessages(); }}
                    className="p-2 rounded-full hover:bg-gray-200 text-navy transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${tLoading || mLoading ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                    title="Clear Chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </header>

              {/* Chat bubbles */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-1"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4d4d4' fill-opacity='0.12'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundColor: "#e5ddd5",
                }}
              >
                {(() => {
                  const activeMessages = messages.filter(msg => !msg.deleted);
                  return (
                    <>
                      {mLoading && activeMessages.length === 0 ? (
                        <div className="flex flex-col gap-3 pt-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                              <div className={`h-8 shimmer rounded-2xl ${i % 2 === 0 ? "w-48" : "w-36"}`} />
                            </div>
                          ))}
                        </div>
                      ) : activeMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="bg-white/70 backdrop-blur-sm text-navy text-xs font-semibold px-4 py-2 rounded-full shadow-sm border border-white/50">
                            No messages yet — send the first reply below
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Date chip */}
                          <div className="flex justify-center mb-4">
                            <span className="bg-white/70 backdrop-blur-sm text-[10px] text-gray-600 font-semibold px-3 py-1 rounded-full shadow-sm">
                              {activeMessages[0]
                                ? new Date(activeMessages[0].createdAt).toLocaleDateString([], {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : ""}
                            </span>
                          </div>
                          {activeMessages.map((msg, idx) => {
                            const isAdmin = msg.senderRole === "admin";
                            const isPending = msg.id.startsWith("temp-");
                            const isFailed = (msg as any).failed === true;
                            const prevMsg = idx > 0 ? activeMessages[idx - 1] : null;
                            const showDate =
                              prevMsg &&
                              new Date(msg.createdAt).toDateString() !==
                                new Date(prevMsg.createdAt).toDateString();
                            return (
                              <div key={msg.id}>
                                {showDate && (
                                  <div className="flex justify-center my-4">
                                    <span className="bg-white/70 backdrop-blur-sm text-[10px] text-gray-600 font-semibold px-3 py-1 rounded-full shadow-sm">
                                      {new Date(msg.createdAt).toLocaleDateString([], {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>
                                )}
                                <ChatBubble
                                  side={isAdmin ? "right" : "left"}
                                  pending={isPending}
                                  failed={isFailed}
                                  message={msg}
                                  canDelete={isAdmin}
                                  onDelete={() => handleDelete(msg.id)}
                                />
                              </div>
                            );
                          })}
                        </>
                      )}
                    </>
                  );
                })()}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll-to-bottom pill */}
              {!stickToBottom && (
                <div className="relative z-10">
                  <button
                    type="button"
                    onClick={() => { scrollToBottom(true); setStickToBottom(true); setUnseenCount(0); }}
                    className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white text-navy text-[11px] font-bold px-4 py-2 rounded-full shadow-lg hover:shadow-xl border border-gray-100 flex items-center gap-1.5 transition-all hover:scale-105"
                  >
                    {unseenCount > 0
                      ? `${unseenCount} new ${unseenCount === 1 ? "message" : "messages"}`
                      : "Jump to latest"}
                    <span aria-hidden className="text-gold">↓</span>
                  </button>
                </div>
              )}

              {/* Composer */}
              <form
                onSubmit={handleSend}
                className="bg-[#f0f2f5] border-t border-gray-200 px-3 py-3 flex items-center gap-2.5 shrink-0"
              >
                {sendError && (
                  <div className="absolute bottom-20 left-4 right-4 z-20 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 flex items-center gap-2 shadow-lg">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{sendError}</span>
                  </div>
                )}
                <button type="button" className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors shrink-0" title="Emoji (coming soon)">
                  <Smile className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    required
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Type a reply to ${activeThread?.patient?.firstName || "patient"}…`}
                    className="w-full bg-white border border-gray-200 rounded-full px-5 py-2.5 text-xs text-navy focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-colors pr-4"
                    disabled={sending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e as any);
                      }
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="bg-gold hover:bg-gold-dark text-navy w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all focus:outline-none disabled:opacity-50 shadow-md cursor-pointer hover:scale-105 active:scale-95"
                  aria-label="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/* ─────────── Chat Bubble ─────────── */

interface BubbleProps {
  side: "left" | "right";
  pending?: boolean;
  failed?: boolean;
  canDelete?: boolean;
  onDelete?: () => void;
  message: {
    id: string;
    body: string;
    deleted?: boolean;
    createdAt: string;
    isRead?: boolean;
    readAt?: string | null;
    senderRole?: string;
  };
}

function ChatBubble({ side, pending, failed, message, canDelete, onDelete }: BubbleProps) {
  const isRight = side === "right";
  const timeString = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex w-full mb-0.5 ${isRight ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[72%] group ${
          isRight
            ? "rounded-2xl rounded-tr-sm"
            : "rounded-2xl rounded-tl-sm"
        } px-3.5 py-2 text-[12.5px] leading-relaxed shadow-sm min-w-[80px] ${
          isRight
            ? `bg-[#d9fdd3] text-navy ${pending ? "opacity-70" : ""} ${failed ? "ring-1 ring-red-300" : ""}`
            : "bg-white text-navy border border-gray-100/80"
        } ${message.deleted ? "italic text-gray-400" : ""}`}
        style={{ wordBreak: "break-word" }}
      >
        {/* Bubble tail */}
        {isRight ? (
          <svg
            className="absolute -right-1.5 top-0 w-3 h-3 text-[#d9fdd3]"
            viewBox="0 0 10 10"
            fill="currentColor"
          >
            <path d="M0 0 Q10 0 10 10 L0 0Z" />
          </svg>
        ) : (
          <svg
            className="absolute -left-1.5 top-0 w-3 h-3 text-white"
            viewBox="0 0 10 10"
            fill="currentColor"
          >
            <path d="M10 0 Q0 0 0 10 L10 0Z" />
          </svg>
        )}

        {/* Delete button */}
        {canDelete && onDelete && !message.deleted && (
          <button
            type="button"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2.5 right-0 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md text-red-400 flex items-center justify-center hover:bg-red-50 hover:text-red-600 z-10"
            aria-label="Delete message"
            title="Delete message"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}

        <p className="whitespace-pre-line break-words pb-4">
          {message.deleted ? "This message was deleted" : message.body}
        </p>

        {/* Time + status */}
        <div className={`absolute bottom-1.5 right-2.5 flex items-center gap-0.5 text-[8.5px] font-semibold ${message.deleted ? "text-gray-300" : "text-gray-400"} select-none`}>
          <span>{timeString}</span>
          {isRight && !message.deleted && (
            <ReadReceipt isRead={!!message.isRead} pending={!!pending} failed={!!failed} />
          )}
        </div>
      </div>
    </div>
  );
}

function ReadReceipt({ isRead, pending, failed }: { isRead: boolean; pending: boolean; failed: boolean }) {
  if (failed) return null;
  if (pending) return <Check className="w-2.5 h-2.5 text-gray-400" aria-label="Sending" />;
  return isRead ? (
    <CheckCheck className="w-2.5 h-2.5 text-sky-500" aria-label="Read" />
  ) : (
    <CheckCheck className="w-2.5 h-2.5 text-gray-400" aria-label="Delivered" />
  );
}
