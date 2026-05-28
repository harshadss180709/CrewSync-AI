import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Lock, Loader2, CheckCircle2, AlertCircle,
  ShieldCheck, Wifi
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

/* ── helpers ───────────────────────────────────────────── */
const BRANDS = { "4": "VISA", "5": "MC", "3": "AMEX", "6": "DISC" };
const BRAND_COLORS = {
  VISA: "text-blue-400", MC: "text-orange-400",
  AMEX: "text-green-400", DISC: "text-yellow-400",
};

const fmtCard   = v => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
const fmtExpiry = v => { const d = v.replace(/\D/g,"").slice(0,4); return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d; };

function CardPreview({ number, name, expiry, brand }) {
  const masked = number.replace(/\s/g,"").padEnd(16,"•");
  const groups = [masked.slice(0,4), masked.slice(4,8), masked.slice(8,12), masked.slice(12,16)];
  return (
    <div className="relative w-full h-44 rounded-2xl overflow-hidden select-none mb-5"
      style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%)" }}>
      {/* Shimmer blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full" />
      </div>
      {/* Chip */}
      <div className="absolute top-6 left-6 w-10 h-7 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md grid grid-cols-2 gap-px p-0.5 opacity-90">
        {Array.from({length:4}).map((_,i)=><div key={i} className="bg-yellow-200/60 rounded-sm"/>)}
      </div>
      {/* Contactless */}
      <Wifi size={16} className="absolute top-6 right-6 text-white/50 rotate-90" />
      {/* Brand */}
      <div className={`absolute top-6 right-12 text-xs font-black tracking-wider ${BRAND_COLORS[brand]||"text-white/40"}`}>
        {brand || ""}
      </div>
      {/* Number */}
      <div className="absolute bottom-14 left-6 flex gap-3">
        {groups.map((g,i) => (
          <span key={i} className="text-white font-mono text-base tracking-widest">{g}</span>
        ))}
      </div>
      {/* Name + Expiry */}
      <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
        <div>
          <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Card Holder</p>
          <p className="text-white text-sm font-medium tracking-wide uppercase truncate max-w-[160px]">
            {name || "YOUR NAME"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5">Expires</p>
          <p className="text-white text-sm font-mono">{expiry || "MM/YY"}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────── */
export default function CardPayment({ projectId, amount, description, onSuccess, onCancel }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry,     setExpiry]     = useState("");
  const [cvc,        setCvc]        = useState("");
  const [name,       setName]       = useState("");
  const [flip,       setFlip]       = useState(false); // show back when typing CVC
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [txRef,      setTxRef]      = useState("");
  const [error,      setError]      = useState("");

  const brand   = BRANDS[cardNumber.replace(/\s/g,"")?.[0]] || "";
  const last4   = cardNumber.replace(/\s/g,"").slice(-4);
  const isValid = cardNumber.replace(/\s/g,"").length === 16 &&
                  expiry.length === 5 && cvc.length >= 3 && name.trim().length >= 2;

  const handlePay = async (e) => {
    e.preventDefault();
    setError("");
    if (!isValid) return setError("Please fill in all card details correctly.");

    // Validate expiry not in past
    const [mm, yy] = expiry.split("/").map(Number);
    const exp = new Date(2000 + yy, mm - 1);
    if (exp < new Date()) return setError("This card has expired.");

    setLoading(true);
    try {
      const { data } = await api.post("/payments/fund", {
        projectId,
        amount,
        type: "milestone",
        notes: description,
        cardLast4: last4,
      });
      setTxRef(data.txRef);
      setDone(true);
      toast.success("Payment successful! Funds in escrow 🔒");
      setTimeout(() => onSuccess?.({ txRef: data.txRef, amount, payment: data.payment }), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* Success screen */
  if (done) {
    return (
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="text-center py-8 space-y-5">
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", delay:0.1 }}
          className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} className="text-green-400" />
        </motion.div>
        <div>
          <p className="text-xl font-bold text-white">Payment Successful!</p>
          <p className="text-sm text-gray-400 mt-1">
            ${amount?.toLocaleString()} is now held securely in escrow.
          </p>
        </div>
        <div className="card p-4 text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Amount</span>
            <span className="text-green-400 font-semibold">${amount?.toLocaleString()} USD</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Card</span>
            <span className="text-white">····{last4} {brand && `(${brand})`}</span>
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
        <p className="text-xs text-gray-600">Freelancers will be notified. Funds release when you approve.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      {/* Amount banner */}
      <div className="flex items-center justify-between p-4 bg-dark-700/40 border border-white/8 rounded-xl">
        <div>
          <p className="text-xs text-gray-500">Amount to fund</p>
          <p className="text-3xl font-black text-white">${amount?.toLocaleString()}<span className="text-sm text-gray-500 ml-1">USD</span></p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <ShieldCheck size={13} /> Escrow protected
          </div>
          <p className="text-[10px] text-gray-600">Held until you approve</p>
        </div>
      </div>

      {/* Card preview */}
      <CardPreview number={cardNumber} name={name} expiry={expiry} brand={brand} />

      {/* Card number */}
      <div>
        <label className="text-xs text-gray-400 font-medium mb-1.5 block">Card Number</label>
        <div className="relative">
          <input type="text" inputMode="numeric" value={cardNumber}
            onChange={e => setCardNumber(fmtCard(e.target.value))}
            placeholder="1234  5678  9012  3456"
            className="input-field pr-20 font-mono tracking-widest"
            maxLength={19} autoComplete="cc-number" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {brand && <span className={`text-[11px] font-black ${BRAND_COLORS[brand]}`}>{brand}</span>}
            <CreditCard size={15} className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-xs text-gray-400 font-medium mb-1.5 block">Cardholder Name</label>
        <input value={name} onChange={e => setName(e.target.value.toUpperCase())}
          placeholder="JOHN SMITH" className="input-field uppercase tracking-wide"
          autoComplete="cc-name" />
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 font-medium mb-1.5 block">Expiry Date</label>
          <input type="text" inputMode="numeric" value={expiry}
            onChange={e => setExpiry(fmtExpiry(e.target.value))}
            placeholder="MM/YY" className="input-field font-mono"
            maxLength={5} autoComplete="cc-exp" />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-medium mb-1.5 block">
            CVC / CVV
          </label>
          <input type="text" inputMode="numeric" value={cvc}
            onChange={e => setCvc(e.target.value.replace(/\D/g,"").slice(0,4))}
            onFocus={() => setFlip(true)} onBlur={() => setFlip(false)}
            placeholder="•••" className="input-field font-mono tracking-widest"
            maxLength={4} autoComplete="cc-csc" />
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
            exit={{ opacity:0, height:0 }}
            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            <AlertCircle size={13} className="flex-shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security note */}
      <div className="flex items-center gap-2 text-[11px] text-gray-600">
        <Lock size={11} className="flex-shrink-0" />
        <span>This is a demo payment. No real charge is made. Funds are simulated in escrow.</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-3 rounded-xl">
          Cancel
        </button>
        <button type="submit" disabled={loading || !isValid}
          className="btn-primary flex-1 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Lock size={15} />
              Pay ${amount?.toLocaleString()}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
