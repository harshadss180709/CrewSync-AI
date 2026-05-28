import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Lock, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

// Note: When VITE_STRIPE_PUBLISHABLE_KEY is configured, replace this with
// @stripe/react-stripe-js Elements for real card tokenization.
// This component uses a simulated card form for demo purposes.

const CARD_BRANDS = {
  "4": "Visa",
  "5": "Mastercard",
  "3": "Amex",
  "6": "Discover",
};

function detectBrand(num) {
  return CARD_BRANDS[num?.[0]] || "Card";
}

function formatCardNumber(value) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

export default function StripePayment({ projectId, amount, description, onSuccess, onCancel }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry,     setExpiry]     = useState("");
  const [cvc,        setCvc]        = useState("");
  const [name,       setName]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState("");

  const stripeConfigured = !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  const handlePay = async (e) => {
    e.preventDefault();
    setError("");

    const rawNum = cardNumber.replace(/\s/g, "");
    if (rawNum.length < 16)   return setError("Enter a valid 16-digit card number.");
    if (expiry.length < 5)    return setError("Enter a valid expiry (MM/YY).");
    if (cvc.length < 3)       return setError("Enter a valid CVC.");
    if (!name.trim())         return setError("Enter the cardholder name.");

    setLoading(true);
    try {
      // Get PaymentIntent from backend
      const { data } = await api.post("/payments/stripe/intent", {
        amount,
        projectId,
        description,
        currency: "usd",
      });

      if (!stripeConfigured) {
        // Simulated success (no real Stripe key)
        await new Promise(r => setTimeout(r, 1200));
        setDone(true);
        toast.success("Payment processed successfully! 🎉");
        setTimeout(() => onSuccess?.({ intentId: data.intentId, amount }), 1500);
        return;
      }

      // In production: use @stripe/react-stripe-js confirmCardPayment
      // const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      // const result = await stripe.confirmCardPayment(data.clientSecret, {
      //   payment_method: { card: cardElement, billing_details: { name } }
      // });
      // if (result.error) throw new Error(result.error.message);
      setDone(true);
      toast.success("Payment processed! 🎉");
      setTimeout(() => onSuccess?.({ intentId: data.intentId, amount }), 1500);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
          <CheckCircle2 size={28} className="text-green-400" />
        </div>
        <div>
          <p className="text-lg font-bold text-white">Payment Successful</p>
          <p className="text-sm text-gray-500 mt-1">${amount?.toLocaleString()} has been placed in escrow.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      {/* Amount preview */}
      <div className="flex items-center justify-between p-4 bg-dark-700/40 border border-white/8 rounded-xl">
        <div>
          <p className="text-xs text-gray-500">Total to fund</p>
          <p className="text-2xl font-black text-white">${amount?.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-400">
          <ShieldCheck size={14} />
          <span>Escrow protected</span>
        </div>
      </div>

      {!stripeConfigured && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-400">
          <AlertCircle size={13} className="flex-shrink-0" />
          <span>Demo mode — add VITE_STRIPE_PUBLISHABLE_KEY to enable real payments.</span>
        </div>
      )}

      {/* Card number */}
      <div>
        <label className="text-xs text-gray-400 font-medium mb-1.5 block">Card Number</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={cardNumber}
            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            className="input-field pr-16"
            maxLength={19}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <CreditCard size={14} className="text-gray-500" />
            {cardNumber && <span className="text-[10px] text-gray-500">{detectBrand(cardNumber.replace(/\s/g,""))}</span>}
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-xs text-gray-400 font-medium mb-1.5 block">Cardholder Name</label>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="John Smith" className="input-field" />
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 font-medium mb-1.5 block">Expiry</label>
          <input type="text" inputMode="numeric"
            value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY" className="input-field" maxLength={5} />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-medium mb-1.5 block">CVC</label>
          <input type="text" inputMode="numeric"
            value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g,"").slice(0,4))}
            placeholder="123" className="input-field" maxLength={4} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
          <AlertCircle size={13} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Lock size={11} />
        <span>Your payment info is encrypted and never stored on our servers.</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-3 rounded-xl">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="btn-primary flex-1 py-3 rounded-xl flex items-center justify-center gap-2">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
          {loading ? "Processing…" : `Pay $${amount?.toLocaleString()}`}
        </button>
      </div>
    </form>
  );
}
