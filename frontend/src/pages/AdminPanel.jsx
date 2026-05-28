import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, FolderKanban, DollarSign, Shield, ToggleLeft, ToggleRight, Send, Loader } from "lucide-react";
import api from "../services/api.js";
import StatsCard from "../components/common/StatsCard.jsx";
import Modal from "../components/common/Modal.jsx";
import { SkeletonStats, SkeletonTable } from "../components/common/LoadingSkeleton.jsx";
import toast from "react-hot-toast";

export default function AdminPanel() {
  const [stats,    setStats]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [tab,      setTab]      = useState("users");
  const [loading,  setLoading]  = useState(true);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcast, setBroadcast] = useState({ title:"", message:"", roles:["freelancer","client"] });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, usersRes, projRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users"),
          api.get("/admin/projects"),
        ]);
        setStats(statsRes.data.stats);
        setUsers(usersRes.data.users||[]);
        setProjects(projRes.data.projects||[]);
      } catch { toast.error("Failed to load admin data"); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const toggleUser = async (userId) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/toggle`);
      setUsers(p => p.map(u => u._id === userId ? { ...u, isActive: data.isActive } : u));
      toast.success(`User ${data.isActive ? "activated" : "deactivated"}`);
    } catch { toast.error("Failed to toggle user"); }
  };

  const sendBroadcast = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/admin/broadcast", broadcast);
      toast.success("Broadcast sent!");
      setShowBroadcast(false);
      setBroadcast({ title:"", message:"", roles:["freelancer","client"] });
    } catch { toast.error("Failed to send broadcast"); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield size={24} className="text-yellow-400"/> Admin Panel
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Platform management & oversight</p>
        </div>
        <button onClick={()=>setShowBroadcast(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Send size={15}/> Broadcast
        </button>
      </div>

      {/* Stats */}
      {loading ? <SkeletonStats/> : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={Users}        label="Total Users"     value={stats.totalUsers||0}                          color="purple" index={0}/>
          <StatsCard icon={FolderKanban} label="Total Projects"  value={stats.totalProjects||0}                       color="cyan"   index={1}/>
          <StatsCard icon={DollarSign}   label="Platform Revenue"value={`$${stats.totalRevenue?.toLocaleString()||0}`}color="green"  index={2}/>
          <StatsCard icon={Shield}       label="Active Projects" value={stats.activeProjects||0}                      color="yellow" index={3}/>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-dark-800/60 rounded-xl border border-white/8 w-fit">
        {["users","projects"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all
              ${tab===t ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Users table */}
      {tab === "users" && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-white/8">
            <h2 className="text-sm font-semibold text-white">All Users ({users.length})</h2>
          </div>
          {loading ? <div className="p-5"><SkeletonTable rows={6}/></div> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    {["User","Email","Role","Status","Joined","Actions"].map(h=>(
                      <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u,i)=>(
                    <motion.tr key={u._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                      className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-muse-pink flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                            {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover"/> : u.name?.[0]}
                          </div>
                          <span className="text-sm text-white font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={u.role==="admin"?"badge-yellow":u.role==="client"?"badge-cyan":"badge-purple"}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${u.isActive?"text-green-400":"text-red-400"}`}>
                          {u.isActive?"Active":"Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={()=>toggleUser(u._id)}
                          className={`p-1.5 rounded-lg transition-colors ${u.isActive?"hover:text-red-400 text-gray-500":"hover:text-green-400 text-gray-500"}`}>
                          {u.isActive ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Projects table */}
      {tab === "projects" && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-white/8">
            <h2 className="text-sm font-semibold text-white">All Projects ({projects.length})</h2>
          </div>
          {loading ? <div className="p-5"><SkeletonTable rows={6}/></div> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    {["Project","Client","Type","Budget","Status","Created"].map(h=>(
                      <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.map((p,i)=>(
                    <motion.tr key={p._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                      className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 text-sm text-white font-medium max-w-[180px] truncate">{p.title}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{p.client?.name||"—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 capitalize">{p.projectType?.replace("_"," ")}</td>
                      <td className="px-4 py-3 text-xs text-green-400">${p.budget?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="badge text-xs bg-dark-600 text-gray-300 capitalize">{p.status?.replace("_"," ")}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Broadcast modal */}
      <Modal isOpen={showBroadcast} onClose={()=>setShowBroadcast(false)} title="📢 Broadcast Notification" size="md">
        <form onSubmit={sendBroadcast} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Title *</label>
            <input value={broadcast.title} onChange={e=>setBroadcast(p=>({...p,title:e.target.value}))}
              placeholder="Platform announcement" className="input-field" required/>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Message *</label>
            <textarea value={broadcast.message} onChange={e=>setBroadcast(p=>({...p,message:e.target.value}))}
              rows={3} className="input-field resize-none" placeholder="Your message…" required/>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">Target Audience</label>
            <div className="flex gap-3">
              {["freelancer","client","admin"].map(r=>(
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox"
                    checked={broadcast.roles.includes(r)}
                    onChange={e=>setBroadcast(p=>({...p,roles:e.target.checked?[...p.roles,r]:p.roles.filter(x=>x!==r)}))}
                    className="accent-brand-500"/>
                  <span className="text-xs text-gray-300 capitalize">{r}s</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={()=>setShowBroadcast(false)} className="btn-secondary flex-1 py-3 rounded-xl">Cancel</button>
            <button type="submit" disabled={sending} className="btn-primary flex-1 py-3 rounded-xl flex items-center justify-center gap-2">
              {sending ? <Loader size={14} className="animate-spin"/> : <Send size={14}/>}
              {sending ? "Sending…" : "Send Broadcast"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
