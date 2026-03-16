"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Zap } from "lucide-react";

// ── Intent responses ────────────────────────────────────────────────────────
const responses: Record<string, string> = {
  failed:
    "Sorry about that! Here's what to do:\n\n✅ Wait up to 2 minutes — it may still be processing\n✅ Check your Transaction History for the current status\n✅ If it shows 'Failed' — your wallet is automatically refunded within 60 seconds\n✅ Still not resolved? Send your Transaction Reference to our WhatsApp and we'll fix it immediately.",

  refund:
    "Your money is safe! All failed transactions are auto-reversed to your wallet within 60 seconds.\n\nIf your balance hasn't updated:\n1. Pull-to-refresh your Wallet page\n2. Check Transaction History — look for a 'Reversed' entry\n3. Still missing after 5 minutes? Send your Transaction ID to our WhatsApp and we'll prioritise your case.",

  buyData:
    "To buy data:\n1. Log in → tap 'Data'\n2. Select your network (MTN, Airtel, Glo, 9mobile)\n3. Pick a bundle plan\n4. Enter the phone number → Confirm\n\nDelivery is instant — usually under 2 seconds! Which network are you buying for?",

  buyAirtime:
    "To buy airtime:\n1. Log in → tap 'Airtime'\n2. Choose your network\n3. Enter amount (min ₦50) + phone number\n4. Confirm purchase\n\nAirtime reaches any Nigerian number in under 2 seconds!",

  electricity:
    "For electricity tokens:\n1. Log in → tap 'Bills' → 'Electricity'\n2. Select your DISCO (EKEDC, IKEDC, AEDC, etc.)\n3. Enter your meter number\n4. Enter amount → Confirm\n\nThe token is displayed on-screen and sent to the phone number on your meter account. Takes 5–30 seconds.",

  cable:
    "For DStv, GOtv, or StarTimes:\n1. Log in → tap 'Cable'\n2. Select your provider\n3. Enter your Smart Card / IUC number\n4. Choose your package → Confirm\n\nSubscription activates within 60 seconds. Make sure your decoder is powered on to receive the renewal.",

  exams:
    "For WAEC, NECO, and NABTEB scratch card PINs:\n1. Log in → tap 'Exam Pins'\n2. Select your exam body\n3. Choose quantity → Confirm\n\nPINs are delivered instantly to your screen and email. Current prices: WAEC ₦3,500 | NECO ₦3,000 | NABTEB ₦2,500.",

  wallet:
    "To fund your wallet:\n1. Log in → tap 'Wallet' → 'Fund Wallet'\n2. Enter the amount\n3. Pay via bank transfer, card (Visa/Mastercard), or USSD\n\nFunds reflect within seconds. No minimum deposit. All Nigerian banks are supported.",

  reseller:
    "Great choice — here's how our reseller programme works:\n\n💰 Bulk discounts up to 5% on all services\n📦 No minimum order requirement\n⚡ Same instant delivery as regular accounts\n🤝 Dedicated account manager\n\nMessage us on WhatsApp at +234 XXX XXX XXXX to activate your reseller account within 24 hours.",

  account:
    "For account issues:\n\n🔑 Forgot password? Click 'Forgot Password' on the login page — reset link arrives in your email within 30 seconds.\n🆕 New user? Click 'Register' — takes under 1 minute.\n🔒 Account locked or suspicious activity? Message our WhatsApp immediately and we'll secure and restore your account.\n\nTell me more about your issue and I'll guide you further!",

  pricing:
    "JWTelecoms has some of the best rates in Nigeria:\n\n📶 Data: MTN 1GB from ₦250 | 2GB from ₦480\n📱 Airtime: face value — zero markup\n⚡ Electricity: no service charge added\n📺 Cable: standard provider prices\n🎓 Exam pins: WAEC ₦3,500 | NECO ₦3,000\n\nResellers get an additional discount. Check the Pricing page for full details!",

  speed:
    "We're built for speed ⚡\n\n• Airtime & Data: under 2 seconds\n• Electricity tokens: 5–30 seconds\n• Cable TV renewal: under 60 seconds\n• Exam PINs: instant on-screen\n\nEverything is fully automated — no manual processing, ever.",

  networks:
    "We support all major Nigerian networks and services:\n\n📶 MTN, Airtel, Glo, 9mobile\n⚡ All DISCOs (EKEDC, IKEDC, AEDC, KAEDCO, JEDC, etc.)\n📺 DStv, GOtv, StarTimes\n🎓 WAEC, NECO, NABTEB\n\nIs there a specific network or service you need help with?",

  contact:
    "Reach our 24/7 team here:\n\n📱 WhatsApp: +234 XXX XXX XXXX (fastest — avg 2 min response)\n📧 Email: support@jwtelecoms.com.ng\n📞 Call: +234 XXX XXX XXXX\n\nFor urgent issues like failed transactions or missing funds, WhatsApp is always the quickest route.",

  security:
    "JWTelecoms is 100% legitimate and secure:\n\n✅ Registered Nigerian business (CAC certified)\n🔒 SSL encryption on every transaction\n🏦 Bank-grade wallet protection\n⭐ Thousands of verified 5-star reviews\n💰 Instant auto-refund on any failed transaction\n\nYour money and personal data are always safe with us.",

  fallback:
    "I want to make sure I help you properly! Could you give me a bit more detail?\n\nFor example:\n• Which service are you trying to use? (data, airtime, bills...)\n• What exactly happened or went wrong?\n\nOr tap one of the quick options below — or contact our WhatsApp for immediate human support.",
};

// ── Intent detection ────────────────────────────────────────────────────────
function detectIntent(text: string): string {
  const t = text.toLowerCase();

  if (/refund|reversal|deducted|charged twice|money.*gone|balance.*wrong|wallet.*deduct/.test(t))
    return "refund";
  if (/fail|didn.t.*come|not.*deliver|not.*receiv|pending|stuck|no.*token|no.*data|no.*airtime|didn.t.*work|didn.t.*go|error/.test(t))
    return "failed";
  if (/\bdata\b|bundle|\bgb\b|\bmb\b|internet/.test(t))
    return "buyData";
  if ((/\bairtime\b|credit|recharge|top.?up/).test(t) && !/data/.test(t))
    return "buyAirtime";
  if (/electr|token|prepaid|ekedc|ikedc|aedc|disco|nepa|phcn|power bill|meter/.test(t))
    return "electricity";
  if (/dstv|gotv|startimes|\bcable\b|decoder|tv.*sub/.test(t))
    return "cable";
  if (/waec|neco|nabteb|\bexam\b|result.*checker|scratch.*card|\bpin\b/.test(t))
    return "exams";
  if (/fund|deposit|add.*money|bank.*transfer|\btopup\b|top.*up/.test(t))
    return "wallet";
  if (/resell|bulk|wholesale|agent|commission|discount/.test(t))
    return "reseller";
  if (/login|log.*in|password|forgot|sign.*in|\bregister\b|sign.*up|locked out/.test(t))
    return "account";
  if (/price|cost|how much|cheap|rate|afford/.test(t))
    return "pricing";
  if (/how.*fast|how.*long|speed|instant|delay|delivery.*time|quick/.test(t))
    return "speed";
  if (/\bmtn\b|airtel|glo|9mobile|etisalat|network/.test(t))
    return "networks";
  if (/contact|speak|human|real person|agent|talk to|whatsapp|call|phone|email/.test(t))
    return "contact";
  if (/safe|secure|scam|legit|trust|real site|fake/.test(t))
    return "security";

  return "fallback";
}

// ── Quick replies ────────────────────────────────────────────────────────────
const quickReplies = [
  "Transaction failed",
  "How do I buy data?",
  "Reseller pricing",
  "Talk to a human",
];

interface Message {
  from: "user" | "bot";
  text: string;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: "Hi there! 👋 I'm JW Assistant. How can I help you today? Tap a quick reply below or type your question.",
    },
  ]);
  const [input, setInput]     = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef          = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { from: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const intent   = detectIntent(text.trim());
      const response = responses[intent];
      setIsTyping(false);
      setMessages(prev => [...prev, { from: "bot", text: response }]);
    }, 900);
  };

  const showQuickReplies = messages.length < 3 && !isTyping;

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-navy text-white shadow-2xl shadow-navy/30 flex items-center justify-center"
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
            <div className="bg-navy p-4 flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">JW Support</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-white/50">Online now</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 22, stiffness: 280 }}
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

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="flex justify-start"
                  >
                    <div className="bg-surface-elevated border border-border rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1 items-center h-4">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 bg-muted rounded-full"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            <AnimatePresence>
              {showQuickReplies && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-2 flex flex-wrap gap-2 flex-shrink-0"
                >
                  {quickReplies.map(reply => (
                    <button
                      key={reply}
                      onClick={() => handleSend(reply)}
                      className="px-3 py-1.5 text-xs font-medium text-accent-dim bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="p-3 border-t border-border flex-shrink-0">
              <form
                onSubmit={e => { e.preventDefault(); handleSend(input); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 text-sm bg-surface-elevated rounded-xl border border-border focus:outline-none focus:border-accent/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center hover:bg-navy-light transition-colors flex-shrink-0 disabled:opacity-40"
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
