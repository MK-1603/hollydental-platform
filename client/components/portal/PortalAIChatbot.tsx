"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare, X, Sparkles, User } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { CLINIC } from "@/lib/constants";

interface Message {
  role: "user" | "model";
  content: string;
}

/**
 * Portal-aware floating chat widget. Posts to /ai/portal-assistant which
 * runs through the centralised prompt library on the server.
 */
export default function PortalAIChatbot() {
  const { user } = useAuthStore();
  const firstName = user?.patientProfile?.firstName || "";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: `Hi${
        firstName ? ` ${firstName}` : ""
      }! I'm the Hollyhill assistant. Ask me about your appointments, treatments, prescriptions, or anything you'd like to know about visiting the clinic.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");
    const userTurn: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userTurn]);
    setLoading(true);

    try {
      const data = await apiRequest("/ai/portal-assistant", {
        method: "POST",
        body: JSON.stringify({
          message: trimmed,
          patientName: firstName,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!data?.reply) throw new Error("Invalid response");
      setMessages((prev) => [
        ...prev,
        { role: "model", content: String(data.reply) },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content:
            "I'm having trouble reaching the assistant right now. For urgent help, please call +353 21 430 3072.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-ai-chatbot
      className="fixed bottom-20 xl:bottom-6 right-4 xl:right-6 z-40 flex flex-col items-end pointer-events-none"
    >
      {open && (
        <div className="flex pointer-events-auto bg-white rounded-2xl border border-gray-100 shadow-2xl flex-col overflow-hidden w-[88vw] max-w-[360px] h-[55vh] max-h-[480px] mb-3 transition-all duration-300">
          <header className="bg-navy text-white p-3 flex items-center justify-between border-b border-gold/20 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-gold bg-navy/40 flex items-center justify-center text-gold font-bold text-[10px]">
                RA
              </div>
              <div>
                <h4 className="text-xs font-serif font-semibold">
                  Hollyhill Assistant
                </h4>
                <span className="text-[9px] text-gray-400 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-gold" /> Powered by Gemini
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${
                  m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    m.role === "user"
                      ? "bg-gold text-navy"
                      : "bg-navy text-gold"
                  }`}
                >
                  {m.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <span className="text-[10px] font-bold">RA</span>
                  )}
                </span>
                <div
                  className={`rounded-2xl p-3.5 text-[13px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-gold text-navy font-medium rounded-tr-none"
                      : "bg-white text-navy border border-gray-100 rounded-tl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
                <span className="w-7 h-7 rounded-full bg-navy text-gold flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold">RA</span>
                </span>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-3.5 flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-gray-100 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your visit, treatments, or care…"
              className="flex-1 border border-gray-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-gold"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-gold hover:bg-gold-dark text-navy p-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex pointer-events-auto w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gold hover:bg-gold-dark text-navy items-center justify-center shadow-2xl relative transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer"
          aria-label="Open assistant"
        >
          <span className="absolute -inset-0.5 rounded-full bg-gold/50 animate-ping opacity-60 pointer-events-none group-hover:hidden" />
          <MessageSquare className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
        </button>
      )}
    </div>
  );
}
