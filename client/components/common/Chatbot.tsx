"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, PhoneCall, MapPin, Clock, Calendar, Stethoscope, Smile, RotateCcw } from "lucide-react";
import { CHATBOT_FAQS, DEFAULT_RESPONSE } from "@/lib/chatbotData";
import { usePathname } from "next/navigation";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
}

const PREDEFINED_QUESTIONS = [
  { id: "services", label: "Available Services", icon: Smile, query: "price" },
  { id: "timings", label: "Consultation Timings", icon: Calendar, query: "consultation" },
  { id: "hours", label: "Working Hours", icon: Clock, query: "hour" },
  { id: "doctors", label: "Doctor Availability", icon: Stethoscope, query: "doctor" },
  { id: "location", label: "Location", icon: MapPin, query: "location" },
  { id: "contact", label: "Contact Info", icon: PhoneCall, query: "contact" },
];

export default function Chatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: Date.now().toString(),
          sender: "bot",
          text: "Hi there! I'm the Hollyhill Dental Assistant. How can I help you today?",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const newUserMsg: Message = { id: Date.now().toString(), sender: "user", text };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue("");

    setIsAnalyzing(true);

    // Process bot response based on keywords
    const lowerText = text.toLowerCase();
    let botResponse = DEFAULT_RESPONSE;

    for (const faq of CHATBOT_FAQS) {
      if (faq.keywords.some((kw) => lowerText.includes(kw))) {
        botResponse = faq.response;
        break;
      }
    }

    setTimeout(() => {
      const newBotMsg: Message = { id: (Date.now() + 1).toString(), sender: "bot", text: botResponse };
      setMessages((prev) => [...prev, newBotMsg]);
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleDeleteMsg = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handlePredefined = (query: string) => {
    handleSend(query);
  };

  const handleReset = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: "bot",
        text: "Hi there! I'm the Hollyhill Dental Assistant. How can I help you today?",
      },
    ]);
    setInputValue("");
    setIsAnalyzing(false);
  };

  if (pathname.startsWith("/portal") || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end" data-ai-chatbot>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-white flex flex-col overflow-hidden md:relative md:inset-auto md:z-auto md:w-[350px] lg:w-[400px] md:h-[550px] md:max-h-[80vh] md:rounded-2xl md:shadow-gold-hover md:border md:border-border-custom md:mb-4"
          >
            {/* Premium Header */}
            <div className="bg-gradient-to-r from-navy to-[#004e75] text-white px-5 py-4 flex items-center justify-between shadow-sm relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-white/5 opacity-10 mix-blend-overlay"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-inner">
                  <Bot size={22} className="text-white drop-shadow-md" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-[16px] m-0 tracking-wide flex items-center gap-2">
                    Hollyhill AI
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  </h3>
                  <p className="text-white/80 text-[11px] font-medium m-0">Intelligent Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1 relative z-10">
                <button
                  onClick={handleReset}
                  className="text-white/70 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg group relative"
                  aria-label="Restart chat"
                  title="Restart chat"
                >
                  <RotateCcw size={18} className="group-hover:-rotate-90 transition-transform duration-300" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/70 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
                  aria-label="Close chat"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#f8fafc] flex flex-col gap-5 no-scrollbar relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 pointer-events-none"></div>
              
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} relative z-10 group`}
                >
                  {msg.sender === "user" && (
                    <button 
                      onClick={() => handleDeleteMsg(msg.id)} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-500 flex items-center justify-center mr-2 self-center bg-white rounded-full shadow-sm"
                      title="Clear message"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <div
                    className={`max-w-[85%] px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                      msg.sender === "user"
                        ? "bg-gradient-to-br from-[#009bde] to-blue-600 text-white rounded-2xl rounded-tr-sm shadow-blue-500/20"
                        : "bg-white text-navy rounded-2xl rounded-tl-sm border border-gray-100 shadow-gray-200/50"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.sender === "bot" && msg.id !== messages[0]?.id && (
                    <button 
                      onClick={() => handleDeleteMsg(msg.id)} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-500 flex items-center justify-center ml-2 self-center bg-white rounded-full shadow-sm"
                      title="Clear message"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              
              {isAnalyzing && (
                <div className="flex justify-start relative z-10 animate-fade-in">
                  <div className="bg-white text-navy rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-1.5 h-1.5 bg-[#009bde] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-[#009bde] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-[#009bde] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-[12px] text-gray-500 font-medium ml-1">Analyzing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length < 3 && !isAnalyzing && (
              <div className="px-5 pb-3 pt-2 bg-white border-t border-gray-50 overflow-x-auto whitespace-nowrap no-scrollbar flex gap-2 shrink-0">
                {PREDEFINED_QUESTIONS.map((q) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={q.id}
                      onClick={() => handlePredefined(q.query)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-[12px] font-semibold text-navy hover:border-[#009bde] hover:bg-[#009bde]/5 hover:text-[#009bde] transition-all flex-shrink-0"
                    >
                      <Icon size={14} className="text-[#009bde]" />
                      {q.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] relative z-20 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputValue);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask a question..."
                    disabled={isAnalyzing}
                    className="w-full bg-gray-50 text-navy rounded-xl pl-4 pr-10 py-3 text-[14px] outline-none focus:ring-2 focus:ring-[#009bde]/20 focus:bg-white border border-transparent focus:border-[#009bde]/30 transition-all placeholder:text-gray-400 disabled:opacity-50"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                     <Smile size={18} className="text-gray-300" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isAnalyzing}
                  className="bg-gradient-to-br from-[#009bde] to-blue-600 text-white p-3 rounded-xl disabled:opacity-50 disabled:grayscale hover:shadow-lg hover:shadow-[#009bde]/30 hover:-translate-y-0.5 transition-all focus:outline-none"
                >
                  <Send size={18} className="ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-navy text-white p-4 rounded-full shadow-gold-hover hover:scale-105 transition-transform flex items-center justify-center relative"
        aria-label="Open chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-gold rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>
    </div>
  );
}
