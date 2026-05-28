import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, ShieldCheck, ExternalLink, Zap } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

/* ── load Razorpay script dynamically ────────────────────── */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayPayment({ projectId, amount, description, userName, userEmail, onSuccess, onCancel }) {
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [txRef,    setTxRef]    = useState("");
  const [error,    setError]    = useState("");
  const [sdkReady, setSdkReady] = useState(false);

  // Pre-load Razorpay script on mount
  useEffect(() => {
    loadRazorpayScript().then(setSdkReady);
  }, []);

  const handlePay = async () => {
    setError("");
    setLoading(true);

    try {
      // Step 1: Create order on backend
      const { data } = await api.post("/payments/razorpay/order", {
        projectId,
        amount,
        notes: description,
      });

      // Demo mode — no real Razorpay popup needed
      if (data.demo) {
        await new Promise(r => setTimeout(r, 1200)); // simulate processing
        const verifyRes = await api.post("/payments/razorpay/verify", {
          razorpayOrderId:   data.orderId,
          razorpayPaymentId: `pay_demo_${Math.random().toString(36).slice(2,10)}`,
          razorpaySignature: "demo",
          projectId,
          amount,
          demo: true,
        });
        setTxRef(verifyRes.data.txRef);
        setDone(true);
        toast.success("Razorpay payment successful! 🎉");
        setTimeout(() => onSuccess?.({ txRef: verifyRes.data.txRef, amount }), 2000);
        return;
      }

      // Step 2: Load Razorpay script if not already loaded
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("Failed to load Razorpay SDK. Check your internet connection.");
        return;
      }

      // Step 3: Open Razorpay checkout popup
      const options = {
        key:         data.keyId,
        amount:      data.amount,           // paise
        currency:    data.currency || "INR",
        name:        "CrewSync AI",
        description: description || `Payment for ${data.projectTitle}`,
        order_id:    data.orderId,
        prefill: {
          name:  userName  || "",
          email: userEmail || "",
        },
        theme: { color: "#7c3aed" },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment cancelled.");
          },
        },
        handler: async (response) => {
          try {
            // Step 4: Verify payment on backend
            const verifyRes = await api.post("/payments/razorpay/verify", {
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              projectId,
              amount,
              demo: false,
            });
            setTxRef(verifyRes.data.txRef);
            setDone(true);
            toast.success("Razorpay payment verified! Funds in escrow 🔒");
            setTimeout(() => onSuccess?.({ txRef: verifyRes.data.txRef, amount }), 2000);
          } catch (err) {
            setError(err?.response?.data?.message || "Payment verification failed.");
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        setError(`Payment failed: ${resp.error?.description || "Unknown error"}`);
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      setError(err?.response?.data?.message || "Failed to initiate payment.");
      setLoading(false);
    } finally {
      // Only reset loading on error paths (success keeps it spinning until done)
      if (!done) setLoading(false);
    }
  };

  /* ── Success screen ──────────────────────────────────── */
  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 space-y-5">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} className="text-green-400" />
        </motion.div>
        <div>
          <p className="text-xl font-bold text-white">Payment Successful!</p>
          <p className="text-sm text-gray-400 mt-1">
            ₹{amount?.toLocaleString()} is now held securely in escrow.
          </p>
        </div>
        <div className="card p-4 text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Amount</span>
            <span className="text-green-400 font-semibold">₹{amount?.toLocaleString()} INR</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Method</span>
            <span className="text-white flex items-center gap-1">
              <img src="https://razorpay.com/favicon.ico" alt="" className="w-3 h-3" />
              Razorpay
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Status</span>
            <span className="text-brand-400 font-semibold">In Escrow 🔒</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Reference</span>
            <span className="text-gray-300 font-mono">{txRef}</span>
          </div>
        </div>
        <p className="text-xs text-gray-600">Freelancers notified. Funds release when you approve.</p>
      </motion.div>
    );
  }

  /* ── Payment initiation screen ───────────────────────── */
  return (
    <div className="space-y-5">
      {/* Amount preview */}
      <div className="flex items-center justify-between p-4 bg-dark-700/40 border border-white/8 rounded-xl">
        <div>
          <p className="text-xs text-gray-500">Amount to fund</p>
          <p className="text-3xl font-black text-white">
            ₹{amount?.toLocaleString()}<span className="text-sm text-gray-500 ml-1">INR</span>
          </p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <ShieldCheck size={13} /> Escrow protected
          </div>
          <p className="text-[10px] text-gray-600">Held until you approve</p>
        </div>
      </div>

      {/* Razorpay branding card */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-gradient-to-br from-[#072654]/40 to-[#0a0a2e]/60 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#072654] rounded-xl flex items-center justify-center border border-[#3395ff]/30 flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 245 262" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 262L61.6 0H183.2C217.6 0 244.8 27.2 244.8 61.6C244.8 89.6 227.2 114.4 201.6 123.2L244.8 262H184L144.8 131.2H96L68 262H0Z" fill="#3395FF"/>
              <path d="M112 104H163.2C177.6 104 189.6 92 189.6 77.6C189.6 63.2 177.6 51.2 163.2 51.2H112V104Z" fill="white"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Pay with Razorpay</p>
            <p className="text-xs text-gray-400">UPI · Cards · Net Banking · Wallets</p>
          </div>
        </div>

        <ul className="space-y-2 mb-5">
          {[
            "Supports UPI, IMPS, Cards, Net Banking",
            "Instant payment confirmation",
            "256-bit SSL encrypted & PCI-DSS compliant",
            "Funds go directly into project escrow",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
              <Zap size={11} className="text-brand-400 flex-shrink-0" /> {item}
            </li>
          ))}
        </ul>

        {/* Powered by */}
        <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
          <span>Powered by</span>
          <span className="text-[#3395FF] font-semibold">Razorpay</span>
          <a href="https://razorpay.com" target="_blank" rel="noreferrer"
            className="text-gray-600 hover:text-gray-400 transition-colors">
            <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            <AlertCircle size={13} className="flex-shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {!sdkReady && (
        <p className="text-xs text-gray-500 flex items-center gap-2">
          <Loader2 size={11} className="animate-spin" /> Loading Razorpay SDK…
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-secondary flex-1 py-3 rounded-xl">
          Cancel
        </button>
        <button onClick={handlePay} disabled={loading}
          className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all
            bg-[#3395FF] hover:bg-[#1a7ee6] text-white disabled:opacity-50 shadow-lg shadow-blue-500/20">
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Processing…</>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 245 262" fill="none" className="flex-shrink-0">
                <path d="M0 262L61.6 0H183.2C217.6 0 244.8 27.2 244.8 61.6C244.8 89.6 227.2 114.4 201.6 123.2L244.8 262H184L144.8 131.2H96L68 262H0Z" fill="white"/>
              </svg>
              Pay ₹{amount?.toLocaleString()} with Razorpay
            </>
          )}
        </button>
      </div>
    </div>
  );
}
