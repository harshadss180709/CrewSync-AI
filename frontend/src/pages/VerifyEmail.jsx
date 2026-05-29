import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader } from "lucide-react";
import api from "../services/api.js";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    api.get(`/auth/verify/${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

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
            <h2 className="text-xl font-bold text-white">Email Verified!</h2>
            <p className="text-gray-400 text-sm">Your account is now verified. You can log in.</p>
            <Link to="/login" className="btn-primary inline-block px-8 py-2.5 rounded-xl mt-2">
              Go to Login
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={44} className="text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Verification Failed</h2>
            <p className="text-gray-400 text-sm">This link is invalid or has already been used.</p>
            <Link to="/login" className="btn-primary inline-block px-8 py-2.5 rounded-xl mt-2">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
