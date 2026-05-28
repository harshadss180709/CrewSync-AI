import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, Circle, Clock, DollarSign, Trash2, Edit2, X, Calendar, ChevronRight, Flag, Loader2 } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  pending:     { label: "Pending",     color: "text-gray-400",   bg: "bg-gray-500/20",   border: "border-gray-500/30",  icon: Circle },
  in_progress: { label: "In Progress", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30", icon: Clock },
  completed:   { label: "Completed",   color: "text-green-400",  bg: "bg-green-500/20",  border: "border-green-500/30",  icon: CheckCircle2 },
  paid:        { label: "Paid",        color: "text-brand-400",  bg: "bg-brand-500/20",  border: "border-brand-500/30",  icon: DollarSign },
};

const emptyForm = { title: "", description: "", amount: "", dueDate: "", deliverables: "" };

export default function MilestoneManager({ project }) {
  const { user }            = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);

  const isClient = project?.client?._id === user?._id || project?.client === user?._id || user?.role === "admin";

  useEffect(() => { if (project?._id) fetchMilestones(); }, [project?._id]);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/projects/${project._id}/milestones`);
      setMilestones(data.milestones || []);
    } catch { toast.error("Failed to load milestones"); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setShowModal(true); };
  const openEdit   = (m) => {
    setEditTarget(m);
    setForm({
      title:       m.title,
      description: m.description || "",
      amount:      m.amount || "",
      dueDate:     m.dueDate ? m.dueDate.split("T")[0] : "",
      deliverables:m.deliverables?.join(", ") || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const payload = {
        title:       form.title,
        description: form.description,
        amount:      Number(form.amount) || 0,
        dueDate:     form.dueDate || null,
        deliverables:form.deliverables ? form.deliverables.split(",").map(d => d.trim()).filter(Boolean) : [],
      };
      if (editTarget) {
        await api.put(`/projects/${project._id}/milestones/${editTarget._id}`, payload);
        toast.success("Milestone updated");
      } else {
        await api.post(`/projects/${project._id}/milestones`, payload);
        toast.success("Milestone added");
      }
      setShowModal(false);
      fetchMilestones();
    } catch { toast.error("Failed to save milestone"); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (m, status) => {
    try {
      await api.put(`/projects/${project._id}/milestones/${m._id}`, { status });
      setMilestones(prev => prev.map(ms => ms._id === m._id ? { ...ms, status } : ms));
      toast.success(`Milestone marked as ${STATUS_CONFIG[status].label}`);
    } catch { toast.error("Failed to update status"); }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Delete milestone "${m.title}"?`)) return;
    try {
      await api.delete(`/projects/${project._id}/milestones/${m._id}`);
      setMilestones(prev => prev.filter(ms => ms._id !== m._id));
      toast.success("Milestone deleted");
    } catch { toast.error("Failed to delete milestone"); }
  };

  const totalAmount    = milestones.reduce((s, m) => s + (m.amount || 0), 0);
  const completedAmt   = milestones.filter(m => ["completed","paid"].includes(m.status)).reduce((s,m) => s + (m.amount||0), 0);
  const completedCount = milestones.filter(m => ["completed","paid"].includes(m.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Milestones</h3>
          <p className="text-sm text-gray-500 mt-0.5">{completedCount}/{milestones.length} completed · ${completedAmt.toLocaleString()} / ${totalAmount.toLocaleString()} paid</p>
        </div>
        {isClient && (
          <button onClick={openCreate} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={15} /> Add Milestone
          </button>
        )}
      </div>

      {/* Progress bar */}
      {milestones.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Overall Progress</span>
            <span className="text-white font-semibold">{milestones.length > 0 ? Math.round((completedCount/milestones.length)*100) : 0}%</span>
          </div>
          <div className="w-full bg-dark-700 rounded-full h-2">
            <motion.div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-muse-violet"
              initial={{ width: 0 }} animate={{ width: `${milestones.length > 0 ? (completedCount/milestones.length)*100 : 0}%` }}
              transition={{ duration: 1, ease: "easeOut" }} />
          </div>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-brand-400" />
        </div>
      ) : milestones.length === 0 ? (
        <div className="card p-12 text-center">
          <Flag size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No milestones yet</p>
          <p className="text-gray-600 text-sm mt-1">Break your project into trackable milestones</p>
          {isClient && (
            <button onClick={openCreate} className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
              <Plus size={14} /> Create First Milestone
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-dark-600" />
          <div className="space-y-4">
            {milestones.map((m, idx) => {
              const cfg   = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending;
              const Icon  = cfg.icon;
              const isOverdue = m.dueDate && new Date(m.dueDate) < new Date() && m.status === "pending";
              return (
                <motion.div key={m._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`relative ml-12 card p-5 border ${cfg.border} hover:border-white/20 transition-all`}>
                  {/* Circle on timeline */}
                  <div className={`absolute -left-[38px] top-5 w-9 h-9 rounded-full ${cfg.bg} border-2 ${cfg.border} flex items-center justify-center`}>
                    <Icon size={16} className={cfg.color} />
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-white">{m.title}</h4>
                        <span className={`badge text-[11px] ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{cfg.label}</span>
                        {isOverdue && <span className="badge text-[11px] bg-red-500/20 text-red-400 border border-red-500/30">Overdue</span>}
                      </div>
                      {m.description && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{m.description}</p>}

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
                        {m.amount > 0 && (
                          <span className="flex items-center gap-1 text-green-400 font-medium">
                            <DollarSign size={12} /> ${m.amount.toLocaleString()}
                          </span>
                        )}
                        {m.dueDate && (
                          <span className={`flex items-center gap-1 ${isOverdue ? "text-red-400" : ""}`}>
                            <Calendar size={12} /> {new Date(m.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {m.deliverables?.length > 0 && (
                          <span>{m.deliverables.length} deliverable{m.deliverables.length > 1 ? "s" : ""}</span>
                        )}
                      </div>

                      {m.deliverables?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.deliverables.map((d, i) => (
                            <span key={i} className="text-[11px] bg-dark-700 border border-white/8 text-gray-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <ChevronRight size={10} />{d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Status Actions */}
                      {isClient && m.status === "pending" && (
                        <button onClick={() => handleStatusChange(m, "in_progress")}
                          className="text-[11px] bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 px-2.5 py-1 rounded-lg transition-colors">
                          Start
                        </button>
                      )}
                      {m.status === "in_progress" && (
                        <button onClick={() => handleStatusChange(m, "completed")}
                          className="text-[11px] bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-lg transition-colors">
                          Complete
                        </button>
                      )}
                      {isClient && m.status === "completed" && (
                        <button onClick={() => handleStatusChange(m, "paid")}
                          className="text-[11px] bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 border border-brand-500/30 px-2.5 py-1 rounded-lg transition-colors">
                          Release
                        </button>
                      )}
                      {isClient && (
                        <>
                          <button onClick={() => openEdit(m)} className="p-1.5 text-gray-500 hover:text-white transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(m)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
              className="relative w-full max-w-md card p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">{editTarget ? "Edit Milestone" : "New Milestone"}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Title *</label>
                  <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
                    className="input-field" placeholder="e.g. Design Mockups Delivered" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                    className="input-field resize-none" rows={2} placeholder="What needs to be done?" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Amount ($)</label>
                    <input type="number" value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))}
                      className="input-field" placeholder="500" min="0" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Due Date</label>
                    <input type="date" value={form.dueDate} onChange={e => setForm(p => ({...p, dueDate: e.target.value}))}
                      className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Deliverables (comma-separated)</label>
                  <input value={form.deliverables} onChange={e => setForm(p => ({...p, deliverables: e.target.value}))}
                    className="input-field" placeholder="Wireframes, Prototype, Final files" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editTarget ? "Update" : "Create"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
