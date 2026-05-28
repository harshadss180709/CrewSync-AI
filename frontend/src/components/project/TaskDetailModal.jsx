import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Save, Loader2, Plus, CheckSquare, Square, Clock, AlertTriangle,
  User, Calendar, Tag, Hash, Trash2, ChevronDown
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const PRIORITIES  = ["low", "medium", "high", "critical"];
const CATEGORIES  = ["design", "development", "audio", "video", "writing", "research", "review", "other"];
const STATUSES    = ["todo", "in_progress", "review", "completed"];

const PRIORITY_COLORS = {
  low: "text-gray-400 border-gray-500/30 bg-gray-500/10",
  medium: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  high: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  critical: "text-red-400 border-red-500/30 bg-red-500/10",
};

export default function TaskDetailModal({ task, project, isOpen, onClose, onTaskUpdated }) {
  const { user } = useAuth();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title:          task.title          || "",
        description:    task.description    || "",
        priority:       task.priority       || "medium",
        status:         task.status         || "todo",
        category:       task.category       || "other",
        dueDate:        task.dueDate        ? task.dueDate.split("T")[0] : "",
        estimatedHours: task.estimatedHours || "",
        loggedHours:    task.loggedHours    || "",
        subtasks:       task.subtasks       ? [...task.subtasks] : [],
      });
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const canManage = project?.client?._id === user?._id ||
                    project?.client     === user?._id  ||
                    task.assignedTo?.some(u => (u._id || u) === user?._id) ||
                    user?.role === "admin";

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      const { data } = await api.put(`/tasks/${task._id}`, {
        title:          form.title,
        description:    form.description,
        priority:       form.priority,
        status:         form.status,
        category:       form.category,
        dueDate:        form.dueDate     || null,
        estimatedHours: Number(form.estimatedHours) || 0,
        loggedHours:    Number(form.loggedHours)    || 0,
        subtasks:       form.subtasks,
      });
      onTaskUpdated?.(data.task);
      toast.success("Task updated");
      onClose();
    } catch { toast.error("Failed to save task"); }
    finally { setSaving(false); }
  };

  const toggleSubtask = (idx) => {
    setForm(p => ({
      ...p,
      subtasks: p.subtasks.map((s, i) => i === idx ? { ...s, completed: !s.completed } : s),
    }));
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setForm(p => ({
      ...p,
      subtasks: [...p.subtasks, { title: newSubtask.trim(), completed: false }],
    }));
    setNewSubtask("");
    setAddingSubtask(false);
  };

  const removeSubtask = (idx) => {
    setForm(p => ({ ...p, subtasks: p.subtasks.filter((_, i) => i !== idx) }));
  };

  const completedSubtasks = form.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks     = form.subtasks?.length || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto card p-0"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/8 sticky top-0 bg-dark-800 z-10">
              <div className="flex items-center gap-2 min-w-0">
                <Hash size={15} className="text-brand-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 flex-shrink-0">Task</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${PRIORITY_COLORS[form.priority]}`}>
                  {form.priority}
                </span>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors flex-shrink-0 ml-2">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Title */}
              <div>
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  disabled={!canManage}
                  className="w-full text-lg font-bold text-white bg-transparent outline-none border-b border-transparent
                    focus:border-brand-500/40 pb-1 transition-colors placeholder-gray-600 disabled:cursor-default"
                  placeholder="Task title…"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  disabled={!canManage}
                  rows={3}
                  className="input-field resize-none disabled:opacity-70 disabled:cursor-default"
                  placeholder="Describe what needs to be done…"
                />
              </div>

              {/* Meta row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Status */}
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <Tag size={10} /> Status
                  </label>
                  <select value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    disabled={!canManage}
                    className="input-field text-sm py-2 disabled:opacity-70">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <AlertTriangle size={10} /> Priority
                  </label>
                  <select value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                    disabled={!canManage}
                    className="input-field text-sm py-2 disabled:opacity-70">
                    {PRIORITIES.map(pr => <option key={pr} value={pr}>{pr}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <Tag size={10} /> Category
                  </label>
                  <select value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    disabled={!canManage}
                    className="input-field text-sm py-2 disabled:opacity-70">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <Calendar size={10} /> Due Date
                  </label>
                  <input type="date" value={form.dueDate}
                    onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                    disabled={!canManage}
                    className="input-field text-sm py-2 disabled:opacity-70" />
                </div>
              </div>

              {/* Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <Clock size={10} /> Estimated Hours
                  </label>
                  <input type="number" min="0" value={form.estimatedHours}
                    onChange={e => setForm(p => ({ ...p, estimatedHours: e.target.value }))}
                    disabled={!canManage}
                    className="input-field text-sm py-2 disabled:opacity-70"
                    placeholder="0" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                    <Clock size={10} /> Logged Hours
                  </label>
                  <input type="number" min="0" value={form.loggedHours}
                    onChange={e => setForm(p => ({ ...p, loggedHours: e.target.value }))}
                    className="input-field text-sm py-2"
                    placeholder="0" />
                </div>
              </div>

              {/* Assigned To */}
              {task.assignedTo?.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 block flex items-center gap-1">
                    <User size={10} /> Assigned To
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {task.assignedTo.map((u, i) => (
                      <div key={u._id || i} className="flex items-center gap-2 bg-dark-700/60 border border-white/8 px-2.5 py-1.5 rounded-lg">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-muse-pink flex items-center justify-center overflow-hidden">
                          {u.avatar
                            ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                            : <span className="text-[8px] font-bold text-white">{u.name?.[0]}</span>
                          }
                        </div>
                        <span className="text-xs text-gray-300">{u.name || u}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtasks */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1">
                    <CheckSquare size={10} /> Subtasks
                    {totalSubtasks > 0 && (
                      <span className="ml-1 text-brand-400">{completedSubtasks}/{totalSubtasks}</span>
                    )}
                  </label>
                  {canManage && (
                    <button onClick={() => setAddingSubtask(true)}
                      className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                      <Plus size={11} /> Add
                    </button>
                  )}
                </div>

                {/* Subtask progress bar */}
                {totalSubtasks > 0 && (
                  <div className="h-1 bg-dark-700 rounded-full mb-3 overflow-hidden">
                    <motion.div className="h-full bg-brand-500 rounded-full"
                      animate={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                      transition={{ duration: 0.3 }} />
                  </div>
                )}

                <div className="space-y-1.5">
                  {form.subtasks?.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                      <button onClick={() => toggleSubtask(i)} className="flex-shrink-0">
                        {s.completed
                          ? <CheckSquare size={15} className="text-brand-400" />
                          : <Square size={15} className="text-gray-500" />
                        }
                      </button>
                      <span className={`flex-1 text-sm ${s.completed ? "line-through text-gray-600" : "text-gray-300"}`}>
                        {s.title}
                      </span>
                      {canManage && (
                        <button onClick={() => removeSubtask(i)}
                          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* New subtask input */}
                  <AnimatePresence>
                    {addingSubtask && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 mt-1">
                        <Square size={15} className="text-gray-600 flex-shrink-0" />
                        <input
                          autoFocus
                          value={newSubtask}
                          onChange={e => setNewSubtask(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") addSubtask(); if (e.key === "Escape") setAddingSubtask(false); }}
                          className="flex-1 bg-dark-700/60 border border-brand-500/30 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none"
                          placeholder="Subtask title… (Enter to add)"
                        />
                        <button onClick={() => setAddingSubtask(false)} className="text-gray-500 hover:text-white">
                          <X size={14} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {totalSubtasks === 0 && !addingSubtask && (
                    <p className="text-xs text-gray-600 py-1">No subtasks yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            {canManage && (
              <div className="flex gap-3 p-5 border-t border-white/8 sticky bottom-0 bg-dark-800">
                <button onClick={onClose} className="btn-secondary flex-1 py-2.5 rounded-xl">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="btn-primary flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
