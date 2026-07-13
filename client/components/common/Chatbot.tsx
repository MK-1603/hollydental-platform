"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, PhoneCall, MapPin, Clock, Calendar, Stethoscope, Smile } from "lucide-react";
import { CHATBOT_FAQS, DEFAULT_RESPONSE } from "@/lib/chatbotData";

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
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
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
    }, 500);
  };

  const handlePredefined = (query: string) => {
    handleSend(query);
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end" data-ai-chatbot>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] rounded-2xl shadow-gold-hover border border-border-custom flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-navy text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-[16px] m-0">Hollyhill Assistant</h3>
                  <p className="text-white/70 text-xs m-0">We typically reply instantly</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-off-white flex flex-col gap-4 no-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-gold text-white rounded-tr-sm"
                        : "bg-white text-navy shadow-card rounded-tl-sm border border-border-custom/50"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length < 3 && (
              <div className="px-4 pb-2 pt-2 bg-off-white overflow-x-auto whitespace-nowrap no-scrollbar flex gap-2">
                {PREDEFINED_QUESTIONS.map((q) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={q.id}
                      onClick={() => handlePredefined(q.query)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border-custom rounded-full text-xs font-medium text-navy hover:border-gold hover:text-gold transition-colors flex-shrink-0 shadow-sm"
                    >
                      <Icon size={12} />
                      {q.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-border-custom">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputValue);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-light-grey text-navy rounded-xl px-4 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-gold/30 placeholder:text-placeholder-custom"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="bg-navy text-white p-2.5 rounded-xl disabled:opacity-50 hover:bg-navy/90 transition-colors"
                >
                  <Send size={18} />
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
