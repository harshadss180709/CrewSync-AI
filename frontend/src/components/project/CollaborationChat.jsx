import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Smile, Bot, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import FileUpload from "../common/FileUpload.jsx";
import Modal from "../common/Modal.jsx";
import api from "../../services/api.js";
import toast from "react-hot-toast";

export default function CollaborationChat({ projectId }) {
  const { user } = useAuth();
  const { on, off, sendTypingStart, sendTypingStop } = useSocket();

  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [sending,     setSending]     = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showUpload,  setShowUpload]  = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // Load existing messages
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/messages/${projectId}`);
        setMessages(data.messages || []);
      } catch { toast.error("Failed to load messages"); }
      finally { setLoading(false); }
    };
    load();
  }, [projectId]);

  // Socket listeners
  useEffect(() => {
    const onNewMsg  = (msg) => setMessages(p => [...p, msg]);
    const onTypingStart = ({ userId, name, avatar }) => {
      if (userId === user._id) return;
      setTypingUsers(p => p.some(u => u.userId === userId) ? p : [...p, { userId, name, avatar }]);
    };
    const onTypingStop = ({ userId }) => {
      setTypingUsers(p => p.filter(u => u.userId !== userId));
    };

    on("message:new",   onNewMsg);
    on("typing:start",  onTypingStart);
    on("typing:stop",   onTypingStop);
    return () => {
      off("message:new",  onNewMsg);
      off("typing:start", onTypingStart);
      off("typing:stop",  onTypingStop);
    };
  }, [on, off, user._id]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleTyping = (e) => {
    setInput(e.target.value);
    sendTypingStart(projectId);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTypingStop(projectId), 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    sendTypingStop(projectId);
    try {
      await api.post(`/messages/${projectId}`, { content: input.trim(), type: "text" });
      setInput("");
    } catch { toast.error("Failed to send message"); }
    finally { setSending(false); }
  };

  const isOwn = (msg) => msg.sender?._id === user._id || msg.sender === user._id;

  return (
    <div className="flex flex-col h-full bg-dark-900/50 rounded-2xl border border-white/8 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-white">Team Chat</span>
        </div>
        <span className="text-xs text-gray-500">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bot size={32} className="text-gray-600 mb-2" />
            <p className="text-sm text-gray-500">No messages yet.</p>
            <p className="text-xs text-gray-600 mt-1">Start collaborating with your team!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const own = isOwn(msg);
            const showAvatar = !own && (i === 0 || messages[i-1]?.sender?._id !== msg.sender?._id);
            return (
              <motion.div
                key={msg._id || i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-2 ${own ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                {!own && (
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 overflow-hidden ${showAvatar ? "opacity-100" : "opacity-0"}`}
                    style={{ background: "linear-gradient(135deg,#6366f1,#ec4899)" }}>
                    {msg.sender?.avatar
                      ? <img src={msg.sender.avatar} alt="" className="w-full h-full object-cover" />
                      : <span className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white">
                          {msg.sender?.name?.[0]}
                        </span>
                    }
                  </div>
                )}

                <div className={`max-w-[75%] ${own ? "items-end" : "items-start"} flex flex-col`}>
                  {showAvatar && !own && (
                    <span className="text-xs text-gray-500 mb-1 px-1">{msg.sender?.name}</span>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                    ${own
                      ? "bg-brand-600 text-white rounded-br-sm"
                      : "bg-dark-700 text-gray-100 border border-white/8 rounded-bl-sm"
                    }
                    ${msg.type === "system" ? "bg-dark-600/50 text-gray-400 text-xs text-center italic" : ""}
                  `}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-600 mt-0.5 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Typing indicators */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-dark-600 flex-shrink-0" />
              <div className="bg-dark-700 border border-white/8 rounded-2xl rounded-bl-sm px-3 py-2">
                <div className="flex gap-1 items-center">
                  {[0,1,2].map(i => (
                    <motion.div key={i}
                      animate={{ y: [0,-4,0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {typingUsers.map(u => u.name).join(", ")} typing…
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-white/8">
        <div className="flex items-center gap-2 bg-dark-700/60 border border-white/10 rounded-xl px-3 py-2 focus-within:border-brand-500/50">
          <button type="button" onClick={() => setShowUpload(true)}
            className="text-gray-600 hover:text-brand-400 transition-colors p-0.5 flex-shrink-0" title="Attach file">
            <Paperclip size={16} />
          </button>
          <input
            value={input}
            onChange={handleTyping}
            placeholder="Message your team…"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          <button type="button" className="text-gray-600 hover:text-gray-400 transition-colors p-0.5">
            <Smile size={16} />
          </button>
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-7 h-7 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={13} className="text-white" />
          </button>
        </div>
      </form>

      {/* File upload modal */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Share a File" size="md">
        <FileUpload
          projectId={projectId}
          onFileUploaded={(f) => {
            // Send a file message to chat
            api.post(`/messages/${projectId}`, {
              content: `📎 [${f?.name || "File"}](${f?.url || "#"})`,
              type: "file",
            }).catch(() => {});
            setShowUpload(false);
          }}
          onClose={() => setShowUpload(false)}
        />
      </Modal>
    </div>
  );
}
