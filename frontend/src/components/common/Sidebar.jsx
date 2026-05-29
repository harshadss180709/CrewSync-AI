import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth }   from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import api from "../../services/api.js";
import {
  LayoutDashboard, FolderKanban, Users, BarChart3,
  CreditCard, Bell, Settings, LogOut, ChevronLeft,
  Shield, Zap, X, Users2
} from "lucide-react";

const navItems = [
  { to: "/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { to: "/projects",     icon: FolderKanban,    label: "Projects" },
  { to: "/freelancers",  icon: Users,           label: "Discover" },
  { to: "/analytics",   icon: BarChart3,        label: "Analytics" },
  { to: "/payments",    icon: CreditCard,       label: "Payments" },
  { to: "/notifications",icon: Bell,            label: "Notifications" },
  { to: "/settings",    icon: Settings,         label: "Settings" },
];

export default function Sidebar({ collapsed, onToggle, onClose }) {
  const { user, logout, isRole } = useAuth();
  const { onNotification }       = useSocket();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Fetch unread count on mount ───────────────────────────
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get("/notifications?limit=1");
        // backend sends 'unread' — was mistakenly read as 'unreadCount' before
        setUnreadCount(data.unread ?? data.unreadCount ?? 0);
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Real-time: bump badge instantly on new notification ───
  useEffect(() => {
    const cleanup = onNotification(() => {
      setUnreadCount(prev => prev + 1);
    });
    return cleanup;
  }, [onNotification]);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="h-full glass-dark border-r border-white/8 flex flex-col">
      {/* Logo */}
      <div className="p-4 flex items-center justify-between h-16 border-b border-white/8">
        <motion.div
          animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
          className="flex items-center gap-2 overflow-hidden"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-muse-violet rounded-lg flex items-center justify-center flex-shrink-0">
            <Users2 size={15} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight whitespace-nowrap">
            Crew<span className="text-gradient">Sync</span>
          </span>
        </motion.div>

        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-muse-violet rounded-lg flex items-center justify-center mx-auto">
            <Users2 size={15} className="text-white" />
          </div>
        )}

        {onClose ? (
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X size={18} />
          </button>
        ) : onToggle && (
          <button onClick={onToggle} className="btn-ghost p-1.5 rounded-lg hidden lg:flex">
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronLeft size={18} />
            </motion.div>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            onClick={() => { if (label === "Notifications") setUnreadCount(0); }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
               ${isActive
                 ? "bg-brand-600/20 text-brand-400 border border-brand-500/30"
                 : "text-gray-400 hover:text-white hover:bg-white/5"
               }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative flex-shrink-0">
                  <Icon size={18} className={isActive ? "text-brand-400" : "text-gray-400 group-hover:text-white"} />
                  {label === "Notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
              </>
            )}
          </NavLink>
        ))}

        {isRole("admin") && (
          <NavLink to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
               ${isActive
                 ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                 : "text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10"
               }`
            }
          >
            <Shield size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Admin Panel</span>}
          </NavLink>
        )}
      </nav>

      {/* AI badge */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 bg-gradient-to-br from-brand-600/20 to-muse-purple/20 rounded-xl border border-brand-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-300">AI Powered</span>
          </div>
          <p className="text-xs text-gray-400">Smart allocation & payment splitting active</p>
        </div>
      )}

      {/* User */}
      <div className="p-3 border-t border-white/8">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <NavLink to={`/profile`} className="flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-muse-pink flex items-center justify-center ring-2 ring-brand-500/30 overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
              }
            </div>
          </NavLink>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={handleLogout} className="btn-ghost p-1.5 text-gray-500 hover:text-red-400">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
