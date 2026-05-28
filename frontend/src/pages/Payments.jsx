import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Clock, CheckCircle, XCircle, ArrowDownCircle, Plus, Loader, CreditCard, ChevronLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import Modal from "../components/common/Modal.jsx";
import StatsCard from "../components/common/StatsCard.jsx";
import CardPayment from "../components/payments/CardPayment.jsx";
import RazorpayPayment from "../components/payments/RazorpayPayment.jsx";
import { PageLoader } from "../components/common/LoadingSkeleton.jsx";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  pending:    "badge-yellow",
  in_escrow:  "badge-cyan",
  approved:   "badge-purple",
  released:   "badge-green",
  cancelled:  "badge-red",
  disputed:   "badge-red",
};

export default function Payments() {
  const { user, isRole } = useAuth();
  const [payments,    setPayments]    = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [projects,    setProjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [showFund,    setShowFund]    = useState(false);    // fund modal
  const [fundMethod,  setFundMethod]  = useState(null);     // null | "card" | "razorpay"
  const [stripeStep,  setStripeStep]  = useState("select"); // "select" | "card" | "razorpay"
  const [stripeForm,  setStripeForm]  = useState({ projectId: "", amount: "", description: "" });
  const [form,        setForm]        = useState({ projectId:"", amount:"", type:"milestone", notes:"" });
  const [saving,      setSaving]      = useState(false);

  const load = async () => {
    try {
      const [paymentsRes, summaryRes] = await Promise.all([
        api.get("/payments"),
        api.get("/payments/summary"),
      ]);
      setPayments(paymentsRes.data.payments || []);
      setSummary(summaryRes.data.summary);
    } catch { toast.error("Failed to load payments"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    if (isRole("client","admin")) {
      api.get("/projects?limit=20").then(r=>setProjects(r.data.projects||[])).catch(()=>{});
    }
  }, []);

  const handleAction = async (paymentId, action) => {
    try {
      await api.put(`/payments/${paymentId}/${action}`);
      toast.success(`Payment ${action}d successfully!`);
      load();
    } catch (err) { toast.error(err?.message || `Failed to ${action}`); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/payments", { ...form, amount: Number(form.amount) });
      toast.success("Payment created & held in escrow 🔒");
      setShowModal(false);
      setForm({ projectId:"", amount:"", type:"milestone", notes:"" });
      load();
    } catch (err) { toast.error(err?.message || "Failed to create payment"); }
    finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-gray-500 text-sm mt-0.5">Smart escrow & contribution-based splits</p>
        </div>
        {isRole("client","admin") && (
          <div className="flex items-center gap-2">
            <button onClick={()=>{ setStripeStep("select"); setFundMethod(null); setShowFund(true); }}
              className="btn-secondary flex items-center gap-2 text-sm">
              <CreditCard size={15} className="text-brand-400"/> Fund Project
            </button>
            <button onClick={()=>setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16}/> New Payment
            </button>
          </div>
        )}
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {isRole("client") ? <>
            <StatsCard icon={DollarSign} label="Total Sent"    value={`$${summary.totalSent?.toLocaleString()||0}`}     color="purple" index={0}/>
            <StatsCard icon={Clock}      label="In Escrow"     value={`$${summary.inEscrow?.toLocaleString()||0}`}      color="yellow" index={1}/>
            <StatsCard icon={CheckCircle}label="Total Released"value={`$${summary.totalReleased?.toLocaleString()||0}`} color="green"  index={2}/>
          </> : <>
            <StatsCard icon={DollarSign} label="Total Earned"  value={`$${summary.totalEarned?.toLocaleString()||0}`}  color="green"  index={0}/>
            <StatsCard icon={Clock}      label="Pending"       value={`$${summary.pendingAmount?.toLocaleString()||0}`} color="yellow" index={1}/>
          </>}
        </div>
      )}

      {/* Escrow banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-600/15 to-muse-cyan/10 border border-brand-500/20 flex items-start gap-3">
        <div className="w-9 h-9 bg-brand-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <CreditCard size={18} className="text-brand-400"/>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-0.5">Smart Escrow System</p>
          <p className="text-xs text-gray-400">
            Payments are automatically held in escrow until approved and released. Revenue splits are calculated from real-time contribution scores — fully transparent and fair.
          </p>
        </div>
      </div>

      {/* Payments list */}
      {payments.length === 0 ? (
        <div className="card p-14 text-center">
          <DollarSign size={40} className="text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400 font-medium">No payments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment, i) => (
            <motion.div key={payment._id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06 }}
              className="card p-4 hover:border-brand-500/20 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <DollarSign size={18} className="text-green-400"/>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white">{payment.project?.title || "Unknown Project"}</p>
                      <span className={STATUS_COLORS[payment.status]||"badge-yellow"}>{payment.status?.replace("_"," ")}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{payment.type} · {new Date(payment.createdAt).toLocaleDateString()}</p>
                    {payment.notes && <p className="text-xs text-gray-600 mt-1 line-clamp-1">{payment.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">${payment.amount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{payment.currency || "USD"}</p>
                  </div>

                  {/* Action buttons */}
                  {isRole("client","admin") && payment.status === "in_escrow" && (
                    <button onClick={()=>handleAction(payment._id,"approve")}
                      className="btn-primary text-xs py-2 px-3 rounded-xl">Approve</button>
                  )}
                  {isRole("client","admin") && payment.status === "approved" && (
                    <button onClick={()=>handleAction(payment._id,"release")}
                      className="bg-green-600 hover:bg-green-500 text-white text-xs py-2 px-3 rounded-xl font-medium transition-colors">
                      Release
                    </button>
                  )}
                </div>
              </div>

              {/* Splits */}
              {payment.splits?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-xs text-gray-500 mb-2">Revenue Splits (Contribution-based)</p>
                  <div className="flex flex-wrap gap-2">
                    {payment.splits.map((s,j)=>(
                      <div key={j} className="flex items-center gap-1.5 px-2.5 py-1 bg-dark-700/60 rounded-lg border border-white/5">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-500 to-muse-pink flex items-center justify-center text-[8px] font-bold text-white">
                          {s.freelancer?.name?.[0]||"?"}
                        </div>
                        <span className="text-xs text-gray-300">{s.freelancer?.name?.split(" ")[0]||"?"}</span>
                        <span className="text-xs font-semibold text-green-400">${s.amount?.toFixed(0)}</span>
                        <span className="text-[10px] text-gray-600">({s.percentage?.toFixed(0)}%)</span>
                        {s.released && <CheckCircle size={10} className="text-green-400"/>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Fund Project Modal — method picker + card/razorpay */}
      <Modal isOpen={showFund} onClose={()=>{ setShowFund(false); setStripeStep("select"); setFundMethod(null); }}
        title={stripeStep === "select" ? "Fund Project" : fundMethod === "razorpay" ? "Pay with Razorpay" : "Pay with Card"}
        size="md">
        <AnimatePresence mode="wait">

          {/* STEP 1 — project + amount */}
          {stripeStep === "select" && (
            <motion.div key="select" initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:16 }}
              className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Project *</label>
                <select value={stripeForm.projectId}
                  onChange={e => setStripeForm(p => ({ ...p, projectId: e.target.value }))}
                  className="input-field" required>
                  <option value="">Select project…</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Amount *</label>
                <input type="number" min="1" value={stripeForm.amount}
                  onChange={e => setStripeForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="500" className="input-field" />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-1.5 block">Description (optional)</label>
                <input value={stripeForm.description}
                  onChange={e => setStripeForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. Milestone 1 funding" className="input-field" />
              </div>

              <div className="p-3 bg-brand-600/10 border border-brand-500/20 rounded-xl text-xs text-brand-300">
                💳 Funds go into secure escrow and auto-split to freelancers based on contribution when released.
              </div>

              {/* Payment method picker */}
              <div>
                <p className="text-xs text-gray-400 font-medium mb-2">Choose payment method</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={!stripeForm.projectId || !stripeForm.amount || Number(stripeForm.amount) < 1}
                    onClick={() => { setFundMethod("card"); setStripeStep("pay"); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 hover:border-brand-500/40 hover:bg-brand-600/10 transition-all disabled:opacity-40 group">
                    <CreditCard size={22} className="text-brand-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-white">Card Payment</span>
                    <span className="text-[10px] text-gray-500">Visa · MC · Amex</span>
                  </button>
                  <button
                    disabled={!stripeForm.projectId || !stripeForm.amount || Number(stripeForm.amount) < 1}
                    onClick={() => { setFundMethod("razorpay"); setStripeStep("pay"); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 hover:border-[#3395FF]/40 hover:bg-[#3395FF]/5 transition-all disabled:opacity-40 group">
                    <svg width="24" height="24" viewBox="0 0 245 262" fill="none" className="group-hover:scale-110 transition-transform">
                      <path d="M0 262L61.6 0H183.2C217.6 0 244.8 27.2 244.8 61.6C244.8 89.6 227.2 114.4 201.6 123.2L244.8 262H184L144.8 131.2H96L68 262H0Z" fill="#3395FF"/>
                      <path d="M112 104H163.2C177.6 104 189.6 92 189.6 77.6C189.6 63.2 177.6 51.2 163.2 51.2H112V104Z" fill="white"/>
                    </svg>
                    <span className="text-xs font-semibold text-white">Razorpay</span>
                    <span className="text-[10px] text-gray-500">UPI · Cards · Wallets</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — payment form */}
          {stripeStep === "pay" && (
            <motion.div key="pay" initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-16 }}>
              <button onClick={() => setStripeStep("select")}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-white mb-4 transition-colors">
                <ChevronLeft size={13}/> Back
              </button>

              {fundMethod === "card" ? (
                <CardPayment
                  projectId={stripeForm.projectId}
                  amount={Number(stripeForm.amount)}
                  description={stripeForm.description || "Project funding"}
                  onSuccess={() => {
                    setTimeout(() => {
                      setShowFund(false);
                      setStripeForm({ projectId: "", amount: "", description: "" });
                      setStripeStep("select");
                      setFundMethod(null);
                      load();
                    }, 2500);
                  }}
                  onCancel={() => setStripeStep("select")}
                />
              ) : (
                <RazorpayPayment
                  projectId={stripeForm.projectId}
                  amount={Number(stripeForm.amount)}
                  description={stripeForm.description || "Project funding"}
                  onSuccess={() => {
                    setTimeout(() => {
                      setShowFund(false);
                      setStripeForm({ projectId: "", amount: "", description: "" });
                      setStripeStep("select");
                      setFundMethod(null);
                      load();
                    }, 2500);
                  }}
                  onCancel={() => setStripeStep("select")}
                />
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </Modal>

      {/* Create Payment Modal */}
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Create Payment" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Project *</label>
            <select value={form.projectId} onChange={e=>setForm(p=>({...p,projectId:e.target.value}))}
              className="input-field" required>
              <option value="">Select project…</option>
              {projects.map(p=><option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Amount (USD) *</label>
            <input type="number" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}
              placeholder="1000" min="1" className="input-field" required/>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Payment Type</label>
            <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="input-field">
              {["milestone","escrow","bonus"].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Notes</label>
            <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
              rows={2} className="input-field resize-none" placeholder="Payment details…"/>
          </div>
          <div className="p-3 bg-dark-700/60 rounded-xl border border-brand-500/20">
            <p className="text-xs text-brand-300">
              💡 Revenue will be automatically split among team members based on their real-time contribution scores.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={()=>setShowModal(false)} className="btn-secondary flex-1 py-3 rounded-xl">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 rounded-xl flex items-center justify-center gap-2">
              {saving ? <Loader size={14} className="animate-spin"/> : <DollarSign size={14}/>}
              {saving ? "Creating…" : "Send to Escrow"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
