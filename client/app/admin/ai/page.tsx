"use client";

import { useState, useRef, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import {
  Sparkles, Send, RefreshCw, Copy, Check, FileText,
  MessageSquare, Rss, Bell, Pill, Bot, User, ChevronRight,
  Trash2, AlertTriangle,
} from "lucide-react";

const TOOLS = [
  { id: "summary",      label: "Clinical Brief",   icon: FileText,      color: "text-blue-500",    desc: "Compile patient history into a concise dental summary" },
  { id: "review",       label: "Review Reply",      icon: MessageSquare, color: "text-emerald-500", desc: "Draft a warm professional response to a patient review" },
  { id: "blog",         label: "Blog Article",      icon: Rss,           color: "text-violet-500",  desc: "Generate SEO-optimised dental blog content" },
  { id: "sms",          label: "SMS Reminder",      icon: Bell,          color: "text-amber-500",   desc: "Write a follow-up SMS reminder for a patient" },
  { id: "prescription", label: "Rx Suggestion",     icon: Pill,          color: "text-red-500",     desc: "Get AI-assisted prescription note drafts" },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  tool?: string;
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

function buildPayload(tool: string, input: string) {
  switch (tool) {
    case "summary":      return { endpoint: "/ai/patient-summary",    body: { name: input || "Patient", age: 38, lastVisit: "June 2025", completedTreatments: "Teeth Cleaning", outstanding: "Composite fillings on 14, 15", medicalNotes: "Penicillin allergy, dental anxiety" } };
    case "review":       return { endpoint: "/ai/review-reply",       body: { reviewText: input || "Great service!", rating: 5 } };
    case "blog":         return { endpoint: "/ai/blog-generate",      body: { topic: input || "Dental hygiene tips", keyword: "dentist Cork" } };
    case "sms":          return { endpoint: "/ai/followup-reminder",  body: { name: input || "Patient", treatment: "Composite Fillings" } };
    case "prescription": return { endpoint: "/ai/prescription-note",  body: { drugName: "Amoxicillin", dosage: "500mg", instructions: "Take 3 times daily" } };
    default:             return { endpoint: "/ai/patient-summary",    body: {} };
  }
}

export default function AdminAIPage() {
  const [activeTool, setActiveTool] = useState("summary");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const tool = TOOLS.find((t) => t.id === activeTool)!;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    setInput("");
    setLoading(true);

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text || `Generate ${tool.label}`, tool: activeTool, ts: new Date() };
    const loadingMsg: Message = { id: `a-${Date.now()}`, role: "assistant", content: "", tool: activeTool, ts: new Date(), loading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const { endpoint, body } = buildPayload(activeTool, text);
      const data = await apiRequest(endpoint, { method: "POST", body: JSON.stringify(body) });
      const content = data.summary || data.reply || data.article || data.smsText || data.note || "No output generated.";
      setMessages((prev) => prev.map((m) => m.id === loadingMsg.id ? { ...m, content, loading: false } : m));
    } catch {
      setMessages((prev) => prev.map((m) => m.id === loadingMsg.id ? { ...m, content: "Failed to generate. Please try again.", loading: false } : m));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!loading) handleSend(); }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => setMessages([]);

  const switchTool = (id: string) => {
    setActiveTool(id);
    setInput("");
  };

  return (
    <div className="flex h-full w-full gap-0 bg-white overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 bg-navy flex flex-col border-r border-white/5 hidden md:flex">
        {/* Brand */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">AI Assistant</p>
              <p className="text-[9px] text-white/40">Powered by Gemini</p>
            </div>
          </div>
        </div>

        {/* Tools */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-3 py-2">Clinical Tools</p>
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button key={t.id} onClick={() => switchTool(t.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? "bg-white/10 border border-white/10" : "hover:bg-white/5"}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-gold/20" : "bg-white/5"}`}>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-gold" : "text-white/40"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${isActive ? "text-white" : "text-white/60"}`}>{t.label}</p>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-gold shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Clear */}
        {messages.length > 0 && (
          <div className="p-3 border-t border-white/10">
            <button onClick={clearChat} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:bg-red-950/20 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Clear conversation
            </button>
          </div>
        )}
      </aside>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <header className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-3 shrink-0">
          <div className={`w-8 h-8 rounded-xl bg-navy/5 flex items-center justify-center`}>
            {(() => { const Icon = tool.icon; return <Icon className={`w-4 h-4 ${tool.color}`} />; })()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-navy">{tool.label}</p>
            <p className="text-[10px] text-gray-400 truncate">{tool.desc}</p>
          </div>
          {/* Mobile tool switcher */}
          <div className="md:hidden flex gap-1 overflow-x-auto no-scrollbar">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => switchTool(t.id)}
                  className={`p-2 rounded-xl border transition-all shrink-0 ${activeTool === t.id ? "bg-navy border-navy" : "border-gray-200"}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${activeTool === t.id ? "text-gold" : "text-gray-400"}`} />
                </button>
              );
            })}
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} className="p-2 rounded-xl border border-gray-200 hover:border-red-200 hover:text-red-500 text-gray-400 transition-colors md:flex hidden">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4" style={{ background: "linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)" }}>

          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-navy/20" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy font-serif">AI Clinical Assistant</p>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    Select a tool from the sidebar and type your prompt, or just press Send to use the default template.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {TOOLS.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button key={t.id} onClick={() => { switchTool(t.id); setTimeout(handleSend, 50); }}
                        className="flex items-center gap-3 bg-white border border-gray-100 hover:border-gold/40 rounded-xl px-4 py-3 text-left transition-all hover:shadow-sm group"
                      >
                        <Icon className={`w-4 h-4 ${t.color} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-navy">{t.label}</p>
                          <p className="text-[10px] text-gray-400 truncate">{t.desc}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gold transition-colors shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === "user";
            const msgTool = TOOLS.find((t) => t.id === msg.tool);
            const Icon = msgTool?.icon || Bot;

            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 ${isUser ? "bg-gold text-navy" : "bg-navy text-gold"}`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-[80%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  {/* Tool badge for assistant */}
                  {!isUser && msgTool && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className={`w-3 h-3 ${msgTool.color}`} />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{msgTool.label}</span>
                    </div>
                  )}

                  <div className={`rounded-2xl px-4 py-3 shadow-sm ${isUser ? "bg-gold text-navy rounded-br-sm" : "bg-white border border-gray-100 rounded-bl-sm"}`}>
                    {msg.loading ? (
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex gap-1">
                          {[0,1,2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                        </div>
                        <span className="text-[11px] text-gray-400">Generating…</span>
                      </div>
                    ) : isUser ? (
                      <p className="text-xs font-medium">{msg.content}</p>
                    ) : (
                      <div className="text-xs text-navy leading-relaxed" dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                    )}
                  </div>

                  {/* Actions row */}
                  <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? "flex-row-reverse" : ""}`}>
                    <span className="text-[9px] text-gray-400">{msg.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {!isUser && !msg.loading && msg.content && (
                      <button onClick={() => handleCopy(msg.id, msg.content)} className="text-[9px] text-gray-400 hover:text-navy flex items-center gap-1 transition-colors">
                        {copiedId === msg.id ? <><Check className="w-3 h-3 text-emerald-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Input bar ── */}
        <div className="bg-white border-t border-gray-100 px-4 py-3 shrink-0">
          {activeTool === "prescription" && (
            <div className="mb-2 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-700 font-medium">AI Rx suggestions must be reviewed by Dr. Roghay before use.</p>
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-gold focus-within:bg-white transition-colors">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${tool.label}… or press Send for default`}
                disabled={loading}
                className="w-full bg-transparent text-xs text-navy placeholder-gray-400 focus:outline-none resize-none leading-relaxed max-h-[120px] overflow-y-auto"
                style={{ height: "20px" }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={loading}
              className="w-10 h-10 rounded-2xl bg-gold hover:bg-yellow-400 text-navy flex items-center justify-center transition-all disabled:opacity-40 shadow-sm hover:shadow-md shrink-0"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[9px] text-gray-300 text-center mt-2">Gemini 1.5 Flash · Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
