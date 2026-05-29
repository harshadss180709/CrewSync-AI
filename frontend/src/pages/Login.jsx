import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || "/dashboard";

  const [form,    setForm]    = useState({ email: "", password: "" });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Please fill in all fields.");
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-1/4 left-1/4   w-[480px] h-[480px] bg-brand-600/10   rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80     h-80     bg-muse-pink/8    rounded-full blur-[110px]" />
        <div className="absolute top-3/4 left-1/2   w-60     h-60     bg-muse-violet/8  rounded-full blur-[90px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[420px]"
      >
        {/* Logo + heading */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-5 group">
            <div className="w-11 h-11 bg-gradient-to-br from-brand-500 to-muse-pink rounded-xl
                            flex items-center justify-center shadow-glow-sm
                            group-hover:shadow-glow-md transition-shadow duration-300">
              <Users size={20} className="text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">
              Crew<span className="text-gradient">Sync</span>
            </span>
          </Link>
          <h1 className="text-[1.6rem] font-bold text-white leading-tight">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1.5">Sign in to your creative workspace</p>
        </div>

        {/* Card */}
        <div className="bg-dark-800/60 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-7 shadow-[0_8px_48px_rgba(0,0,0,0.45)]">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
              <div className="relative group">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-400 transition-colors duration-200" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="you@creative.com"
                  autoComplete="email"
                  required
                  className="w-full bg-dark-700/60 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5
                             text-sm text-white placeholder-gray-600 outline-none
                             transition-all duration-200
                             focus:border-brand-500/60 focus:bg-dark-700/80 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]
                             hover:border-white/[0.14]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-400">Password</label>
                <Link to="/forgot-password"
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors duration-150 hover:underline underline-offset-2">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-400 transition-colors duration-200" />
                <input
                  type={show ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-dark-700/60 border border-white/[0.08] rounded-xl pl-10 pr-11 py-2.5
                             text-sm text-white placeholder-gray-600 outline-none
                             transition-all duration-200
                             focus:border-brand-500/60 focus:bg-dark-700/80 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]
                             hover:border-white/[0.14]"
                />
                <button
                  type="button"
                  onClick={() => setShow((p) => !p)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-150 p-0.5 rounded"
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full mt-1 flex items-center justify-center gap-2 py-3 rounded-xl
                         font-semibold text-sm text-white overflow-hidden group
                         bg-gradient-to-r from-brand-600 to-brand-500
                         shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_32px_rgba(99,102,241,0.55)]
                         hover:from-brand-500 hover:to-brand-400
                         active:scale-[0.985] transition-all duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {/* Shimmer sweep on hover */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent
                               -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              {loading ? (
                <div className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform duration-150" />
                </>
              )}
            </button>

          </form>
        </div>

        {/* Footer CTA */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link to="/register"
            className="text-brand-400 hover:text-brand-300 font-medium transition-colors duration-150 hover:underline underline-offset-2">
            Create one free →
          </Link>
        </p>

      </motion.div>
    </div>
  );
}
