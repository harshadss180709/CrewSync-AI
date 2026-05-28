import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || "/dashboard";

  const [form,    setForm]    = useState({ email: "", password: "" });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Please fill in all fields.");
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back! 🎵");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.message || "Invalid credentials.");
    } finally { setLoading(false); }
  };

  const demoLogin = async (role) => {
    const demos = {
      client:     { email: "client@crewsync.ai",     password: "Demo@123" },
      freelancer: { email: "freelancer@crewsync.ai", password: "Demo@123" },
      admin:      { email: "admin@crewsync.ai",       password: "Demo@123" },
    };
    setLoading(true);
    try {
      await login(demos[role].email, demos[role].password);
      toast.success(`Logged in as demo ${role}`);
      navigate("/dashboard");
    } catch { toast.error("Demo account not seeded yet. Please register."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-muse-pink/10 rounded-full blur-[100px]" />
      </div>

      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
        className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-muse-pink rounded-xl flex items-center justify-center shadow-glow-sm">
              <Users size={20} className="text-white"/>
            </div>
            <span className="text-2xl font-black text-white">Crew<span className="text-gradient">Sync</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your creative workspace</p>
        </div>

        <div className="card p-7 border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" value={form.email}
                  onChange={e => setForm(p=>({...p,email:e.target.value}))}
                  placeholder="you@creative.com"
                  className="input-field pl-10" required />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-400">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={show ? "text" : "password"} value={form.password}
                  onChange={e => setForm(p=>({...p,password:e.target.value}))}
                  placeholder="Enter your password"
                  className="input-field pl-10 pr-10" required />
                <button type="button" onClick={() => setShow(p=>!p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl mt-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Sign In</span><ArrowRight size={16}/></>
              }
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/8" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-dark-800 px-3 text-xs text-gray-500">or try a demo</span>
            </div>
          </div>

          {/* Demo accounts */}
          <div className="grid grid-cols-3 gap-2">
            {["client","freelancer","admin"].map(role => (
              <button key={role} onClick={() => demoLogin(role)} disabled={loading}
                className="btn-secondary text-xs py-2 rounded-xl capitalize">{role}</button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Create one free →</Link>
        </p>
      </motion.div>
    </div>
  );
}
