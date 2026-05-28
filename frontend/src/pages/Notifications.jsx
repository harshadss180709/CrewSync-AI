import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import toast from "react-hot-toast";

const TYPE_ICONS = {
  project_invite: "📨", task_assigned: "✅", payment_received: "💸",
  payment_pending: "🔒", project_update: "📢", message: "💬",
  review_received: "⭐", milestone_completed: "🏆", admin_alert: "🔔", system: "ℹ️",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/notifications?limit=50");
      setNotifications(data.notifications || []);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`).catch(()=>{});
    setNotifications(p => p.map(n => n._id === id ? { ...n, isRead: true } : n));
  };
  const markAllRead = async () => {
    await api.put("/notifications/read-all").catch(()=>{});
    setNotifications(p => p.map(n => ({ ...n, isRead: true })));
    toast.success("All marked as read");
  };
  const deleteN = async (id) => {
    await api.delete(`/notifications/${id}`).catch(()=>{});
    setNotifications(p => p.filter(n => n._id !== id));
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-500 text-sm mt-0.5">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-ghost text-xs flex items-center gap-1.5 text-brand-400">
            <CheckCheck size={14}/> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({length:5}).map((_,i)=>
          <div key={i} className="skeleton h-16 rounded-xl"/>)}</div>
      ) : notifications.length === 0 ? (
        <div className="card p-14 text-center">
          <Bell size={36} className="text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400">No notifications yet.</p>
        </div>
      ) : (
        <AnimatePresence>
          {notifications.map((n, i) => (
            <motion.div key={n._id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, height:0 }} transition={{ delay: i*0.03 }}
              className={`flex items-start gap-3 p-4 rounded-2xl border transition-all
                ${n.isRead ? "card opacity-70" : "card border-brand-500/20 bg-brand-600/5"}`}
              onClick={() => { if (!n.isRead) markRead(n._id); }}
            >
              <div className="w-9 h-9 bg-dark-700/60 rounded-xl flex items-center justify-center flex-shrink-0 text-base">
                {TYPE_ICONS[n.type]||"🔔"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${n.isRead ? "text-gray-300" : "text-white"}`}>{n.title}</p>
                  {!n.isRead && <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1"/>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-gray-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {n.link && (
                  <Link to={n.link} className="btn-ghost p-1.5 rounded-lg text-gray-600 hover:text-brand-400">
                    <ExternalLink size={13}/>
                  </Link>
                )}
                <button onClick={(e)=>{ e.stopPropagation(); deleteN(n._id); }}
                  className="btn-ghost p-1.5 rounded-lg text-gray-600 hover:text-red-400">
                  <Trash2 size={13}/>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
