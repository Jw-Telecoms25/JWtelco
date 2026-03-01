"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Zap } from "lucide-react";

const quickReplies = [
  "How do I buy data?",
  "My transaction failed",
  "Reseller pricing",
  "Talk to support",
];

const botResponses: Record<string, string> = {
  "How do I buy data?":
    "Easy! 1) Log in to your account 2) Click 'Buy Data' 3) Select your network and plan 4) Enter your phone number 5) Click 'Purchase'. Your data will be delivered in seconds!",
  "My transaction failed":
    "Sorry about that! Failed transactions are auto-reversed within 60 seconds. Check your wallet balance. If it hasn't reversed, please share your transaction ID and our team will fix it immediately.",
  "Reseller pricing":
    "Great choice! We offer up to 5% discount on bulk purchases for resellers. Contact us on WhatsApp at +234 XXX XXX XXXX to set up your reseller account with special pricing.",
  "Talk to support":
    "You can reach our 24/7 support team via:\n\n📱 WhatsApp: +234 XXX XXX XXXX\n📧 Email: support@jwtelecoms.com.ng\n📞 Call: +234 XXX XXX XXXX\n\nAverage response time: under 2 minutes!",
};

interface Message {
  from: "user" | "bot";
  text: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: "Hi there! 👋 I'm JW Assistant. How can I help you today? Tap a quick reply below or type your question.",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { from: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const response =
        botResponses[text.trim()] ||
        "Thanks for your message! For detailed help, please contact our support team on WhatsApp at +234 XXX XXX XXXX. They'll sort you out in no time! 🚀";
      setMessages((prev) => [...prev, { from: "bot", text: response }]);
    }, 800);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-navy text-white shadow-2xl shadow-navy/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ping */}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent animate-pulse" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[380px] rounded-2xl bg-white border border-border shadow-2xl shadow-black/10 overflow-hidden flex flex-col"
            style={{ maxHeight: "min(70vh, 560px)" }}
          >
            {/* Header */}
            <div className="bg-navy p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">JW Support</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald" />
                  <span className="text-xs text-white/50">Online now</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                      msg.from === "user"
                        ? "bg-navy text-white rounded-br-md"
                        : "bg-surface-elevated text-navy/80 border border-border rounded-bl-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick replies */}
            {messages.length < 3 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleSend(reply)}
                    className="px-3 py-1.5 text-xs font-medium text-accent-dim bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 text-sm bg-surface-elevated rounded-xl border border-border focus:outline-none focus:border-accent/40 transition-colors"
                />
                <button
                  type="submit"
                  className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center hover:bg-navy-light transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
