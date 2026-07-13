"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatThread } from "@/lib/useChatThread";
import { CLINIC } from "@/lib/constants";
import { toast } from "@/lib/toast";
import { apiRequest } from "@/lib/api";
import { Send, ChevronLeft, RefreshCw, AlertCircle, Check, CheckCheck, Phone, MoreVertical, Smile, Paperclip, Shield, Trash2, Plus, Mic } from "lucide-react";

export default function PortalMessagesPage() {
  const { user } = useAuthStore();
  const patientId = user?.patientProfile?.id || null;
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const { messages, loading, error, refetch, sendMessage, markRead } = useChatThread({ patientId, selfRole: "patient" });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);
  const lastCountRef = useRef(0);

  const scrollToBottom = (smooth = true) => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setStickToBottom(atBottom);
    if (atBottom) setUnseenCount(0);
  };

  useEffect(() => {
    const prev = lastCountRef.current;
    const next = messages.length;
    lastCountRef.current = next;
    if (next === 0) return;
    if (stickToBottom) { requestAnimationFrame(() => scrollToBottom(true)); setUnseenCount(0); }
    else if (next > prev) setUnseenCount((c) => c + (next - prev));
  }, [messages.length, stickToBottom]);

  useEffect(() => {
    if (!patientId) return;
    markRead();
    const onFocus = () => markRead();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [patientId, markRead]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending || !patientId) return;
    setSending(true);
    setSendError(null);
    try {
      await sendMessage(body);
      setInput("");
      inputRef.current?.focus();
    } catch (err: any) {
      setSendError(err?.message || "Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); }
  };

  const handleClearChat = async () => {
    if (!patientId) return;
    const ok = await toast.confirm({
      title: "Clear Chat History?",
      message: "Are you sure you want to clear this entire conversation?",
      confirmText: "Clear Chat",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiRequest(`/messages/patient/${patientId}`, { method: "DELETE" });
      refetch();
      setShowMenu(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to clear chat");
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    const ok = await toast.confirm({
      title: "Unsend this message?",
      message: "This message will be permanently removed for everyone.",
      confirmText: "Unsend",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiRequest(`/messages/${msgId}`, { method: "DELETE" });
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to unsend message");
    }
  };

  // Group messages by date, filtering out deleted ones
  const grouped: { date: string; msgs: typeof messages }[] = [];
  const activeMessages = messages.filter(msg => !msg.deleted);

  activeMessages.forEach((msg) => {
    const d = new Date(msg.createdAt).toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" });
    const last = grouped[grouped.length - 1];
    if (last && last.date === d) last.msgs.push(msg);
    else grouped.push({ date: d, msgs: [msg] });
  });

  const lastMessage = activeMessages[activeMessages.length - 1];

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">

        {/* ── Chat header ── */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0 z-10">
          <Link href="/portal/dashboard" className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-navy transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center font-bold text-gold text-sm">
              RA
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-navy truncate">{CLINIC.name}</p>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {loading ? "Refreshing…" : error ? "Connection issue" : "Online · replies within 24h"}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0 relative">
            <a href={CLINIC.phoneHref} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
              <Phone className="w-4 h-4" />
            </a>
            <button onClick={refetch} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors" title="More options">
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50">
                  <button onClick={handleClearChat} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Clear Chat
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* ── Wallpaper / message area ── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-1 relative"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: "#e5ddd5",
          }}
        >
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-gray-400">Loading messages…</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 max-w-xs">
                <div className="w-16 h-16 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-navy/20" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy font-serif">Secure Clinical Messaging</p>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    Send a message to Dr. Roghay and the Hollyhill team. All messages are private and encrypted.
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-[10px] text-gray-500 text-left space-y-1">
                  <p className="font-bold text-navy">💡 You can ask about:</p>
                  <p>• Appointment queries & rescheduling</p>
                  <p>• Post-treatment concerns</p>
                  <p>• Prescription questions</p>
                  <p>• General dental advice</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {grouped.map(({ date, msgs }) => (
                <div key={date} className="space-y-1">
                  {/* Date divider */}
                  <div className="flex items-center gap-3 py-3">
                    <div className="flex-1 h-px bg-gray-200/60" />
                    <span className="text-[10px] font-semibold text-gray-400 bg-white/80 px-3 py-1 rounded-full border border-gray-100 shadow-sm">{date}</span>
                    <div className="flex-1 h-px bg-gray-200/60" />
                  </div>
                  {msgs.map((msg) => {
                    const isPatient = msg.senderRole === "patient";
                    const isPending = msg.id.startsWith("temp-");
                    const isFailed = (msg as any).failed === true;
                    const initial = (user?.patientProfile?.firstName?.[0] || "P").toUpperCase();
                    return (
                      <Bubble
                        key={msg.id}
                        side={isPatient ? "right" : "left"}
                        avatar={isPatient ? initial : "RA"}
                        pending={isPending}
                        failed={isFailed}
                        message={msg}
                        onDelete={() => handleDeleteMessage(msg.id)}
                      />
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── Jump to latest pill ── */}
        {!stickToBottom && (
          <div className="relative shrink-0">
            <button
              onClick={() => { scrollToBottom(true); setStickToBottom(true); setUnseenCount(0); }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-navy text-white text-[11px] font-semibold px-4 py-1.5 rounded-full shadow-lg hover:bg-navy/90 transition-colors flex items-center gap-1.5 z-10"
            >
              {unseenCount > 0 ? `${unseenCount} new message${unseenCount > 1 ? "s" : ""}` : "Jump to latest"} ↓
            </button>
          </div>
        )}

        {/* ── Input bar ── */}
        <div className="bg-[#f0f2f5] border-t border-gray-200 px-4 py-3 shrink-0 flex items-end gap-3 z-10">
          {sendError && (
            <div className="absolute bottom-[72px] left-4 right-4 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {sendError}
            </div>
          )}
          <form onSubmit={handleSend} className="flex-1 flex items-end gap-3 w-full">
            <div className="flex-1 bg-white border border-gray-300 rounded-3xl px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-gold/30 focus-within:border-gold transition-all relative">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                disabled={sending}
                className="w-full bg-transparent text-sm text-navy placeholder-gray-400 focus:outline-none resize-none leading-relaxed max-h-[120px] overflow-y-auto pr-8"
                style={{ height: "24px" }}
              />
              <button
                type="button"
                className="absolute right-3 bottom-2.5 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-11 h-11 rounded-full bg-gold hover:bg-yellow-400 text-navy flex items-center justify-center transition-all shadow-md shrink-0 mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Bubble ── */
interface BubbleProps {
  side: "left" | "right";
  avatar: string;
  pending?: boolean;
  failed?: boolean;
  message: { id: string; body: string; deleted?: boolean; createdAt: string; isRead?: boolean; readAt?: string | null };
  onDelete?: () => void;
}

function Bubble({ side, avatar, pending, failed, message, onDelete }: BubbleProps) {
  const isRight = side === "right";
  const time = pending ? "Sending…" : failed ? "Failed" : new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex gap-1.5 mb-1 ${isRight ? "flex-row-reverse" : "flex-row"}`}>
      {!isRight && (
        <div className="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center text-[10px] font-bold text-navy shrink-0 mt-auto mb-1 border border-white">
          {avatar}
        </div>
      )}

      <div className={`max-w-[75%] flex flex-col group relative ${isRight ? "items-end" : "items-start"}`}>
        <div
          className={`relative px-3.5 py-2 text-[13px] leading-relaxed shadow-sm flex flex-col ${isRight
              ? `bg-[#dcf8c6] text-gray-800 rounded-t-2xl rounded-bl-2xl rounded-br-sm ${pending ? "opacity-70" : ""} ${failed ? "ring-1 ring-red-300" : ""}`
              : "bg-white text-gray-800 rounded-t-2xl rounded-br-2xl rounded-bl-sm border border-gray-100"
            }`}
        >
          <p className="whitespace-pre-line break-words mr-10">{message.body}</p>
          <div className="absolute bottom-1 right-2 flex items-center gap-1">
            <span className="text-[9px] text-gray-400">{time}</span>
            {isRight && !pending && !failed && (
              message.isRead
                ? <CheckCheck className="w-3 h-3 text-blue-500" />
                : <CheckCheck className="w-3 h-3 text-gray-400" />
            )}
            {isRight && pending && <Check className="w-3 h-3 text-gray-400" />}
            {isRight && failed && <AlertCircle className="w-3 h-3 text-red-400" />}
          </div>
        </div>

        {isRight && !pending && (
          <button
            onClick={onDelete}
            className="absolute top-1/2 -translate-y-1/2 -left-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1.5 bg-white rounded-full shadow-sm border border-gray-100"
            title="Unsend message"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
