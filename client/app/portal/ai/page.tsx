"use client";

import { useState, useRef, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Sparkles, Send, RefreshCw, Copy, Check, Calendar,
  Activity, Pill, Building, Bot, User, ChevronRight,
  Trash2, AlertCircle, Info,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  ts: Date;
  loading?: boolean;
}

function parseMarkdown(md: string) {
  if (!md) return "";
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^### (.*?)$/gm, "<h4 class='font-bold text-navy text-xs mt-3 mb-1'>$1</h4>")
    .replace(/^## (.*?)$/gm, "<h3 class='font-bold text-navy text-sm mt-4 mb-1.5'>$1</h3>")
    .replace(/^# (.*?)$/gm, "<h2 class='font-bold text-navy text-base mt-5 mb-2'>$1</h2>")
    .replace(/^\s*[-*]\s+(.*?)$/gm, "<li class='ml-4 list-disc text-[11px] text-gray-700 my-0.5'>$1</li>")
    .replace(/\n/g, "<br />");
}

const QUICK_PROMPTS = [
  { id: "appt",   label: "Check My Appointments",  icon: Calendar,   color: "text-blue-500",    text: "Can you tell me about my upcoming dental appointments?" },
  { id: "chart",  label: "Explain Treatment Plan", icon: Activity,   color: "text-emerald-500", text: "What is my active treatment plan and what care steps are left?" },
  { id: "rx",     label: "Review Prescriptions",   icon: Pill,       color: "text-amber-500",   text: "Can you review my prescriptions and tell me about my medications?" },
  { id: "clinic", label: "Hollyhill Clinic Info",  icon: Building,   color: "text-violet-500",  text: "What are the clinic opening hours, phone number, and location details?" },
];

export default function PatientAIPage() {
  const { user } = useAuthStore();
  const firstName = user?.patientProfile?.firstName || "there";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "model",
      content: `Hi ${firstName}! I'm the Hollyhill AI Care Assistant. I can help explain your treatments, check your appointments, summarize prescriptions, or answer general clinic questions. What can I do for you today?`,
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text) return;
    if (!customText) setInput("");
    setLoading(true);

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text, ts: new Date() };
    const loadingMsg: Message = { id: `a-${Date.now()}`, role: "model", content: "", ts: new Date(), loading: true };
    
    // Save previous history to prevent mutating inside setMessages
    const currentHistory = messages.map((m) => ({ role: m.role, content: m.content }));
    
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const data = await apiRequest("/ai/portal-assistant", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          patientName: firstName,
          history: [...currentHistory, { role: "user", content: text }],
        }),
      });
      const content = data?.reply || "No response generated. Please try again.";
      setMessages((prev) => prev.map((m) => m.id === loadingMsg.id ? { ...m, content, loading: false } : m));
    } catch {
      setMessages((prev) => prev.map((m) => m.id === loadingMsg.id ? { ...m, content: "I'm having trouble connecting right now. For urgent help, please call +353 21 430 3072.", loading: false } : m));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSend();
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "initial",
        role: "model",
        content: `Hi ${firstName}! I'm the Hollyhill AI Care Assistant. What can I do for you today?`,
        ts: new Date(),
      },
    ]);
  };

  return (
    <div className="flex h-full w-full bg-white overflow-hidden flex-col">
      {/* Page Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h1 className="text-sm font-serif font-bold text-navy flex items-center gap-1.5">
              AI Care Assistant
            </h1>
            <p className="text-[10px] text-gray-400">Personalized oral care guidance & info</p>
          </div>
        </div>
        {messages.length > 1 && (
          <button onClick={clearChat} className="p-2 rounded-xl border border-gray-150 hover:border-red-200 hover:text-red-500 text-gray-400 transition-colors flex items-center gap-1.5 text-[11px] font-bold">
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </header>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div key={msg.id} className={`flex gap-3.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-xs font-semibold text-xs ${
                  isUser ? "bg-gold text-navy" : "bg-navy text-gold"
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  {!isUser && msg.id !== "initial" && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3 h-3 text-gold" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Gemini Powered</span>
                    </div>
                  )}

                  <div className={`rounded-2xl px-4.5 py-3 shadow-xs border ${
                    isUser
                      ? "bg-gold border-gold/40 text-navy rounded-br-sm font-medium"
                      : "bg-white border-gray-150/80 text-navy rounded-bl-sm"
                  }`}>
                    {msg.loading ? (
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-400 font-semibold">Answering…</span>
                      </div>
                    ) : isUser ? (
                      <p className="text-xs leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="text-xs text-navy leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                    )}
                  </div>

                  {/* Timestamp & Actions */}
                  <div className={`flex items-center gap-2.5 mt-1 px-1 text-[9px] text-gray-400 ${isUser ? "flex-row-reverse" : ""}`}>
                    <span>{msg.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {!isUser && !msg.loading && msg.content && (
                      <button onClick={() => handleCopy(msg.id, msg.content)} className="hover:text-navy flex items-center gap-1 transition-colors">
                        {copiedId === msg.id ? (
                          <><Check className="w-3 h-3 text-emerald-500" /> Copied</>
                        ) : (
                          <><Copy className="w-3 h-3" /> Copy</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Prompts cards - only show when there is only the initial welcome message */}
        {messages.length === 1 && (
          <div className="max-w-lg mx-auto pt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_PROMPTS.map((qp) => {
              const Icon = qp.icon;
              return (
                <button
                  key={qp.id}
                  onClick={() => handleSend(qp.text)}
                  className="flex items-start gap-3 bg-white border border-gray-150/70 hover:border-gold/50 rounded-2xl p-3.5 text-left transition-all hover:shadow-md group cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-gold/10 transition-colors`}>
                    <Icon className={`w-4 h-4 ${qp.color} group-hover:text-gold transition-colors`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-navy truncate group-hover:text-gold transition-colors">{qp.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 leading-normal">{qp.text}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gold self-center shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Input Bar Section */}
      <div className="bg-white border-t border-gray-100 p-4 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* AI Clinical Disclaimer banner */}
          <div className="flex items-start gap-2.5 bg-sky-50/50 border border-sky-100/60 rounded-xl px-3.5 py-2">
            <Info className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-sky-800 leading-normal font-medium">
              AI advice is for general informational support. Please consult Dr. Roghay Alizadeh or Hollyhill staff for official clinical diagnosis.
            </p>
          </div>

          <div className="flex items-end gap-2.5">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-gold focus-within:bg-white transition-colors">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your appointments, care plan, or dental health…"
                disabled={loading}
                className="w-full bg-transparent text-xs text-navy placeholder-gray-400 focus:outline-none resize-none leading-relaxed max-h-[120px] overflow-y-auto"
                style={{ height: "20px" }}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-2xl bg-gold hover:bg-yellow-400 text-navy flex items-center justify-center transition-all disabled:opacity-40 shadow-sm hover:shadow-md shrink-0 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[9px] text-gray-300 text-center mt-1.5">
            Hollyhill Dental Assistant · Powered by Gemini · Enter to Send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
