import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Trash2, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import api           from "../services/api.js";
import { useSocket } from "../context/SocketContext.jsx";
import toast         from "react-hot-toast";

const TYPE_META = {
  project_invite:      { icon: "📨", label: "Invite"    },
  task_assigned:       { icon: "✅", label: "Task"      },
  payment_received:    { icon: "💸", label: "Payment"   },
  payment_pending:     { icon: "🔒", label: "Escrow"    },
  project_update:      { icon: "📢", label: "Update"    },
  message:             { icon: "💬", label: "Message"   },
  review_received:     { icon: "⭐", label: "Review"    },
  milestone_completed: { icon: "🏆", label: "Milestone" },
  deadline_reminder:   { icon: "⏰", label: "Deadline"  },
  ai_suggestion:       { icon: "✨", label: "AI"        },
  admin_alert:         { icon: "🔔", label: "Admin"     },
  system:              { icon: "ℹ️",  label: "System"   },
};

export default function Notifications() {
  const { onNotification }                = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error,   setError]               = useState(null);

  // ── Fetch from API ────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/notifications?limit=50");
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (err) {
      setError(err?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Real-time: prepend new notification instantly ─────────
  useEffect(() => {
    if (!onNotification) return;
    return onNotification((notif) => {
      setNotifications((prev) => {
        // Deduplicate by _id
        if (prev.some((n) => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
      // Also show a toast so it's visible from any page
      toast(notif.title, {
        icon:     TYPE_META[notif.type]?.icon ?? "🔔",
        duration: 4500,
      });
    });
  }, [onNotification]);

  // ── Actions ───────────────────────────────────────────────
  const markRead = async (id) => {
    setNotifications((p) => p.map((n) => n._id === id ? { ...n, isRead: true } : n));
    await api.put(`/notifications/${id}/read`).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications((p) => p.map((n) => ({ ...n, isRead: true })));
    await api.put("/notifications/read-all").catch(() => {});
    toast.success("All notifications marked as read");
  };

  const deleteN = async (id) => {
    setNotifications((p) => p.filter((n) => n._id !== id));
    await api.delete(`/notifications/${id}`).catch(() => {});
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? "Loading…"
              : error  ? "Could not load"
              : unread > 0 ? `${unread} unread`
              : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && !loading && (
            <button
              onClick={markAllRead}
              className="btn-ghost text-xs flex items-center gap-1.5 text-brand-400 hover:text-brand-300"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <button
            onClick={load}
            disabled={loading}
            title="Refresh"
            className="btn-ghost p-2 rounded-xl text-gray-500 hover:text-gray-300 disabled:opacity-40"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && !loading && (
        <div className="card p-4 border border-red-500/20 bg-red-500/5 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300 flex-1">{error}</p>
          <button onClick={load} className="text-xs text-red-400 hover:text-red-300 flex-shrink-0">
            Retry
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[72px] rounded-2xl bg-dark-700/40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && notifications.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-14 text-center"
        >
          <Bell size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No notifications yet</p>
          <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto">
            Express interest in a project, get invited to a team, or receive a payment to see activity here.
          </p>
        </motion.div>
      )}

      {/* Notification list */}
      {!loading && !error && notifications.length > 0 && (
        <AnimatePresence initial={false}>
          {notifications.map((n, i) => {
            const meta = TYPE_META[n.type] ?? { icon: "🔔", label: "" };
            return (
              <motion.div
                key={n._id}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0,    scale: 1    }}
                exit={{    opacity: 0, height: 0 }}
                transition={{ duration: 0.18, delay: i < 12 ? i * 0.025 : 0 }}
                onClick={() => { if (!n.isRead) markRead(n._id); }}
                className={`
                  group flex items-start gap-3 p-4 rounded-2xl border
                  cursor-pointer select-none transition-all duration-150
                  ${n.isRead
                    ? "card opacity-75 hover:opacity-100"
                    : "bg-brand-600/5 border-brand-500/25 hover:bg-brand-600/8"}
                `}
              >
                {/* Type icon */}
                <div className="w-9 h-9 rounded-xl bg-dark-700/60 flex items-center justify-center flex-shrink-0 text-base">
                  {meta.icon}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium leading-snug ${n.isRead ? "text-gray-300" : "text-white"}`}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1.5 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {meta.label && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider bg-dark-600 border border-white/8 text-gray-500 px-1.5 py-0.5 rounded-md">
                        {meta.label}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-600">
                      {new Date(n.createdAt).toLocaleString([], {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions — visible on hover (`group` on parent triggers these) */}
                <div
                  className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {n.link && (
                    <Link
                      to={n.link}
                      className="btn-ghost p-1.5 rounded-lg text-gray-600 hover:text-brand-400 transition-colors"
                      title="Open"
                    >
                      <ExternalLink size={13} />
                    </Link>
                  )}
                  <button
                    onClick={() => deleteN(n._id)}
                    className="btn-ghost p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-colors"
                    title="Dismiss"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

    </div>
  );
}
