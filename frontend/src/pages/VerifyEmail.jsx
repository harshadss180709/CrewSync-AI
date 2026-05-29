import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader, MailOpen, RefreshCw } from "lucide-react";
import api from "../services/api.js";
import toast from "react-hot-toast";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status,  setStatus]  = useState("loading"); // loading | success | error
  const [email,   setEmail]   = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    api.get(`/auth/verify/${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  const resend = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email first.");
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email });
      toast.success("Verification email sent! Check your inbox.");
      setEmail("");
    } catch (err) {
      toast.error(err?.message || "Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 p-6">
      <div className="card max-w-md w-full p-10 text-center space-y-5">
        {status === "loading" && (
          <>
            <Loader size={44} className="text-brand-400 animate-spin mx-auto" />
            <p className="text-gray-300 text-lg font-medium">Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 size={44} className="text-green-400 mx-auto" />
            <div>
              <h2 className="text-xl font-bold text-white">Email Verified!</h2>
              <p className="text-gray-400 text-sm mt-1">
                Your account is now active. Welcome to CrewSync AI.
              </p>
            </div>
            <Link to="/login" className="btn-primary inline-block px-8 py-2.5 rounded-xl mt-2">
              Go to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={44} className="text-red-400 mx-auto" />
            <div>
              <h2 className="text-xl font-bold text-white">Link Expired or Invalid</h2>
              <p className="text-gray-400 text-sm mt-1">
                This verification link has expired (valid for 24 hours) or has already been used.
              </p>
            </div>

            {/* Resend form */}
            <div className="border border-white/10 rounded-xl p-4 space-y-3 text-left">
              <div className="flex items-center gap-2 text-brand-400 mb-1">
                <MailOpen size={15} />
                <span className="text-xs font-semibold">Request a new link</span>
              </div>
              <form onSubmit={resend} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-field flex-1 py-2 text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="btn-primary px-3 py-2 rounded-xl flex items-center gap-1 text-sm"
                >
                  {resending
                    ? <Loader size={13} className="animate-spin" />
                    : <><RefreshCw size={13} /> Send</>
                  }
                </button>
              </form>
            </div>

            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-300 inline-block">
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
