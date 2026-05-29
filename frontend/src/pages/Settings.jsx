import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Lock, User, Palette, Shield, Loader, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import toast from "react-hot-toast";

const tabs = [
  { id:"account",       label:"Account",        icon: User    },
  { id:"security",      label:"Security",       icon: Lock    },
  { id:"notifications", label:"Notifications",  icon: Bell    },
];

export default function Settings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [pwForm,    setPwForm]    = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [notifPrefs,setNotifPrefs]= useState(user?.notificationPrefs || { email:true, push:true, payments:true, projects:true });
  const [loading,   setLoading]   = useState(false);
  const [saved,     setSaved]     = useState(false);

  const showSaved = () => { setSaved(true); setTimeout(()=>setSaved(false), 2000); };

  const changePw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error("Passwords don't match.");
    setLoading(true);
    try {
      await api.put("/auth/change-password", { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success("Password changed successfully!");
      setPwForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch (err) { toast.error(err?.message || "Failed to change password"); }
    finally { setLoading(false); }
  };

  const saveNotifPrefs = async () => {
    try {
      await api.put("/users/profile", { notificationPrefs: notifPrefs });
      showSaved();
      toast.success("Notification preferences saved.");
    } catch { toast.error("Failed to save."); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account preferences</p>
      </div>

      <div className="flex gap-1 p-1 bg-dark-800/60 rounded-xl border border-white/8 w-fit">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all
              ${activeTab===t.id ? "bg-brand-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
            <t.icon size={13}/>{t.label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}>
        {activeTab === "account" && (
          <div className="card p-6 space-y-5">
            <h2 className="text-base font-semibold text-white">Account Information</h2>
            <div className="grid gap-4">
              <div className="flex items-center gap-4 p-4 bg-dark-700/40 rounded-xl">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-muse-pink flex items-center justify-center overflow-hidden">
                  {user?.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full object-cover"/>
                    : <span className="text-xl font-black text-white">{user?.name?.[0]}</span>
                  }
                </div>
                <div>
                  <p className="text-white font-semibold">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <span className="badge-purple mt-1 inline-block capitalize">{user?.role}</span>
                </div>
              </div>
              {[
                { label:"Member Since", value: new Date(user?.createdAt||Date.now()).toLocaleDateString("en-US",{year:"numeric",month:"long"}) },
                { label:"Account Status", value: user?.isActive ? "✅ Active" : "❌ Inactive" },
                { label:"Email Verified", value: user?.isVerified ? "✅ Verified" : "⚠️ Unverified" },
                { label:"Last Active", value: user?.lastActive ? new Date(user.lastActive).toLocaleString() : "—" },
              ].map(row=>(
                <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                  <span className="text-sm text-gray-400">{row.label}</span>
                  <span className="text-sm text-white font-medium">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <button onClick={()=>{ logout(); }} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                Sign out of all sessions →
              </button>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-5">Change Password</h2>
            <form onSubmit={changePw} className="space-y-4 max-w-sm">
              {[
                { key:"currentPassword", label:"Current Password" },
                { key:"newPassword",     label:"New Password"     },
                { key:"confirmPassword", label:"Confirm New Password" },
              ].map(f=>(
                <div key={f.key}>
                  <label className="text-xs text-gray-400 font-medium mb-1.5 block">{f.label}</label>
                  <input type="password" value={pwForm[f.key]}
                    onChange={e=>setPwForm(p=>({...p,[f.key]:e.target.value}))}
                    placeholder="••••••••" className="input-field" required/>
                </div>
              ))}
              <button type="submit" disabled={loading}
                className="btn-primary flex items-center gap-2 py-2.5 px-5 rounded-xl">
                {loading ? <Loader size={14} className="animate-spin"/> : <Shield size={14}/>}
                {loading ? "Updating…" : "Update Password"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-5">Notification Preferences</h2>
            <div className="space-y-4">
              {[
                { key:"email",    label:"Email Notifications",    desc:"Receive updates via email"            },
                { key:"push",     label:"Push Notifications",     desc:"In-app real-time alerts"              },
                { key:"payments", label:"Payment Alerts",         desc:"When payments are sent or received"   },
                { key:"projects", label:"Project Updates",        desc:"Task assignments and project changes" },
              ].map(pref=>(
                <div key={pref.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/3 transition-colors">
                  <div>
                    <p className="text-sm text-white font-medium">{pref.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{pref.desc}</p>
                  </div>
                  <button
                    onClick={()=>setNotifPrefs(p=>({...p,[pref.key]:!p[pref.key]}))}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200
                      ${notifPrefs[pref.key] ? "bg-brand-600" : "bg-dark-600"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200
                      ${notifPrefs[pref.key] ? "left-5" : "left-0.5"}`}/>
                  </button>
                </div>
              ))}
            </div>
            <button onClick={saveNotifPrefs}
              className={`mt-5 flex items-center gap-2 py-2.5 px-5 rounded-xl font-medium text-sm transition-all
                ${saved ? "bg-green-600 text-white" : "btn-primary"}`}>
              {saved ? <><Check size={14}/>Saved!</> : "Save Preferences"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
