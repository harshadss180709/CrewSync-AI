import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, Loader } from "lucide-react";
import api from "../services/api.js";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("Passwords don't match.");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password: form.password });
      toast.success("Password reset! You can now log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err?.message || "Reset link is invalid or expired.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 p-6">
      <div className="card max-w-md w-full p-10 space-y-6">
        <div className="text-center">
          <Lock size={40} className="text-brand-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">Set New Password</h2>
          <p className="text-gray-500 text-sm mt-1">Enter a new password for your account.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" placeholder="New password" required
            value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            className="input-field" />
          <input type="password" placeholder="Confirm new password" required
            value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
            className="input-field" />
          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2">
            {loading ? <><Loader size={15} className="animate-spin"/>Resetting…</> : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
