import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, Loader2, ChevronDown, Zap } from "lucide-react";
import api from "../../services/api";
import { useLocation } from "react-router-dom";

const QUICK_PROMPTS = [
  "Summarize project progress",
  "Who should I assign the next task?",
  "Detect workflow bottlenecks",
  "Estimate project completion date",
  "Suggest productivity improvements",
  "What are the main risks?",
];

export default function AIAssistant() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your CrewSync AI assistant. Ask me anything about your projects, tasks, team, or workflow. 🚀" }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse]     = useState(false);
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);
  const location              = useLocation();

  // Extract projectId from URL if inside a project workspace
  const projectId = location.pathname.startsWith("/projects/")
    ? location.pathname.split("/")[2]
    : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // Pulse the button every 30s to draw attention
  useEffect(() => {
    const t = setInterval(() => { setPulse(true); setTimeout(() => setPulse(false), 1500); }, 30000);
    return () => clearInterval(t);
  }, []);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const { data } = await api.post("/ai/chat", { message: msg, projectId });
      setMessages(prev => [...prev, { role: "assistant", text: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[360px] bg-dark-800 border border-white/10 rounded-2xl shadow-glass overflow-hidden flex flex-col"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-600/20 to-muse-violet/10 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-muse-violet flex items-center justify-center shadow-glow-sm">
                  <Sparkles size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">CrewSync AI</p>
                  <p className="text-[10px] text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" /> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-muse-violet flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={12} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-600 text-white rounded-br-sm"
                      : "bg-dark-700 text-gray-200 rounded-bl-sm border border-white/5"
                  }`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-muse-violet flex items-center justify-center flex-shrink-0">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-dark-700 border border-white/5 px-3 py-2 rounded-xl rounded-bl-sm flex items-center gap-1">
                    {[0,1,2].map(i => (
                      <motion.span key={i} className="w-1.5 h-1.5 bg-brand-400 rounded-full"
                        animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Quick prompts</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.slice(0,4).map(p => (
                    <button key={p} onClick={() => sendMessage(p)}
                      className="text-[11px] bg-dark-700 hover:bg-brand-600/20 hover:border-brand-500/40 border border-white/8 text-gray-400 hover:text-white px-2.5 py-1 rounded-lg transition-all">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-2 border-t border-white/8">
              <div className="flex items-end gap-2 bg-dark-700 rounded-xl border border-white/8 px-3 py-2">
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey} rows={1} placeholder="Ask anything about your project..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 resize-none outline-none leading-relaxed max-h-20 min-h-[20px]" />
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                  className="w-7 h-7 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0">
                  {loading ? <Loader2 size={13} className="animate-spin text-white" /> : <Send size={13} className="text-white" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        animate={pulse && !open ? { scale: [1, 1.15, 1] } : {}}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-muse-violet shadow-glow-md hover:shadow-glow-lg flex items-center justify-center transition-shadow relative"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><ChevronDown size={22} className="text-white" /></motion.div>
            : <motion.div key="open"  initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Zap size={22} className="text-white" /></motion.div>
          }
        </AnimatePresence>
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-dark-950" />
        )}
      </motion.button>
    </div>
  );
}
