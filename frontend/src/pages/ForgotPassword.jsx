import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Mail, ArrowLeft, Loader, CheckCircle2 } from "lucide-react";
import api from "../services/api.js";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email.");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      toast.error(err?.message || "Failed to send reset link. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-muse-pink/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-muse-pink rounded-xl flex items-center justify-center shadow-glow-sm">
              <Users size={20} className="text-white" />
            </div>
            <span className="text-2xl font-black text-white">
              Crew<span className="text-gradient">Sync</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your email and we'll send a reset link
          </p>
        </div>

        <div className="card p-7 border-white/10">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 size={30} className="text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Check your inbox</p>
                <p className="text-gray-400 text-sm mt-1">
                  We sent a password reset link to{" "}
                  <span className="text-brand-400 font-medium">{email}</span>.
                  The link expires in 1 hour.
                </p>
              </div>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Didn't receive it? Send again
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@creative.com"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl mt-2"
              >
                {loading ? (
                  <><Loader size={15} className="animate-spin" /> Sending…</>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          <Link
            to="/login"
            className="text-brand-400 hover:text-brand-300 font-medium inline-flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Back to login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
