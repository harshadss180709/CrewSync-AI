import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bell, Search, Menu, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import api from "../../services/api.js";

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const [unread,    setUnread]    = useState(0);
  const [search,    setSearch]    = useState("");
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get("/notifications?limit=1");
        setUnread(data.unread || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 glass-dark border-b border-white/8 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden btn-ghost p-2 rounded-xl">
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className={`relative transition-all duration-300 ${searching ? "w-64" : "w-44"} hidden sm:block`}>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearching(true)}
            onBlur={() => { setSearching(false); setSearch(""); }}
            placeholder="Search projects…"
            className="w-full bg-dark-700/60 border border-white/8 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 focus:bg-dark-700"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Socket status */}
        <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${isConnected ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="font-medium">{isConnected ? "Live" : "Offline"}</span>
        </div>

        {/* Notifications */}
        <Link to="/notifications" className="relative btn-ghost p-2 rounded-xl">
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <Link to="/profile" className="flex items-center gap-2 hover:bg-white/5 rounded-xl px-2 py-1.5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-muse-pink flex items-center justify-center overflow-hidden ring-1 ring-brand-500/30">
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              : <span className="text-xs font-bold text-white">{user?.name?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-white leading-none">{user?.name?.split(" ")[0]}</p>
            <p className="text-[10px] text-gray-500 capitalize">{user?.role}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
