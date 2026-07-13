"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, RotateCcw, Clock, MapPin, Calendar, Smile, Stethoscope, PhoneCall, ChevronDown } from "lucide-react";
import { CHATBOT_FAQS, DEFAULT_RESPONSE } from "@/lib/chatbotData";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
}

const PREDEFINED_QUESTIONS = [
  { id: "services", label: "Treatments & Prices", icon: Smile, query: "price" },
  { id: "booking", label: "Book Appointment", icon: Calendar, query: "book appointment" },
  { id: "timings", label: "Consultation Info", icon: Clock, query: "consultation" },
  { id: "contact", label: "Contact Clinic", icon: PhoneCall, query: "contact" },
  { id: "location", label: "Clinic Location", icon: MapPin, query: "location" },
  { id: "doctors", label: "Our Doctors", icon: Stethoscope, query: "doctor" },
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: Date.now().toString(),
          sender: "bot",
          text: "Welcome to the Hollyhill Dental Clinic Support AI. I can assist you with treatment pricing, clinic hours, and booking information. How can I help you today?",
        },
      ]);
    }
  }, [messages.length]);

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

  const handleReset = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: "bot",
        text: "Session reset. How can I assist you today?",
      },
    ]);
    setInputValue("");
    setIsAnalyzing(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-navy relative">
      {/* Ambient background styling */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#00ADEF]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex-none px-4 py-2 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between z-20 shrink-0 sticky top-0">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-[15px] text-navy leading-tight whitespace-nowrap block">Hollyhill Assistance</span>
              <p className="text-[11px] text-gray-500 font-medium whitespace-nowrap">Automated clinical assistance</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="text-gray-400 hover:text-navy hover:bg-gray-100 p-2 rounded-full transition-colors flex items-center justify-center shrink-0"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6 z-10 scrollbar-hide flex flex-col items-start w-full relative"
        onScroll={handleScroll}
      >
        <div className="w-full space-y-4 md:space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 md:gap-5 w-full ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.sender === "user" ? "bg-gray-200" : "bg-navy"}`}>
                  {msg.sender === "user" ? <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" /> : <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />}
                </div>
                
                {/* Message Body */}
                <div
                  className={`px-4 py-3 md:px-5 md:py-3.5 text-[14px] md:text-[15px] leading-relaxed whitespace-pre-wrap max-w-[90%] md:max-w-[85%] ${
                    msg.sender === "user"
                      ? "bg-gray-100 text-gray-800 rounded-2xl rounded-tr-sm"
                      : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 max-w-[85%] mr-auto"
            >
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-navy flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-white animate-pulse" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm border border-gray-100 px-4 py-3 md:px-5 md:py-4 shadow-sm flex items-center gap-1.5 h-[40px] md:h-[48px]">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Jump to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-[130px] md:bottom-[140px] right-4 md:right-8 bg-white/90 backdrop-blur-sm text-navy p-2 rounded-full shadow-md border border-gray-200 z-30 hover:bg-gray-50 transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex-none px-4 py-3 md:px-8 md:py-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-20 flex flex-col items-start shrink-0 w-full">
        <div className="w-full space-y-2.5">
          {/* Quick Actions */}
          {!isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 overflow-x-auto scrollbar-hide w-full pb-2"
            >
              {PREDEFINED_QUESTIONS.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleSend(q.query)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 px-3.5 py-2 rounded-full transition-colors shadow-sm whitespace-nowrap shrink-0"
                >
                  {q.label}
                </button>
              ))}
            </motion.div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className="relative flex items-center bg-white border border-gray-200 rounded-3xl shadow-sm focus-within:ring-2 focus-within:ring-navy/5 focus-within:border-navy/20 transition-all"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Message Hollyhill AI..."
              className="w-full bg-transparent pl-6 pr-14 py-4 text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none"
              disabled={isAnalyzing}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isAnalyzing}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center hover:bg-navy/90 disabled:opacity-30 disabled:hover:bg-navy transition-all"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
          <p className="text-[10px] text-gray-400 text-center">
            Hollyhill AI can make mistakes. Consider verifying important information.
          </p>
        </div>
      </div>
    </div>
  );
}
