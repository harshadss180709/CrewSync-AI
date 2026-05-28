import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, Clock, AlertCircle, Eye, Trash2 } from "lucide-react";
import api from "../../services/api.js";
import toast from "react-hot-toast";

const columns = [
  { id: "todo",        label: "To Do",       color: "border-gray-500/30",   dot: "bg-gray-500"  },
  { id: "in_progress", label: "In Progress",  color: "border-brand-500/30",  dot: "bg-brand-500" },
  { id: "review",      label: "Review",       color: "border-yellow-500/30", dot: "bg-yellow-500"},
  { id: "completed",   label: "Completed",    color: "border-green-500/30",  dot: "bg-green-500" },
];

const priorityColors = {
  low:      "text-gray-400",
  medium:   "text-yellow-400",
  high:     "text-orange-400",
  critical: "text-red-400",
};

export default function TaskBoard({ tasks = [], projectId, onTaskUpdated, onTaskDeleted, onTaskClick, canManage }) {
  const [dragging, setDragging] = useState(null);

  const getColumnTasks = (colId) => tasks.filter(t => t.status === colId);

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!dragging || dragging.status === newStatus) return;
    try {
      await api.put(`/tasks/${dragging._id}`, { status: newStatus });
      onTaskUpdated?.({ ...dragging, status: newStatus });
      toast.success(`Moved to ${newStatus.replace("_"," ")}`);
    } catch { toast.error("Failed to move task"); }
    setDragging(null);
  };

  const handleDelete = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      onTaskDeleted?.(taskId);
      toast.success("Task deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map(col => (
        <div key={col.id}
          onDragOver={e => e.preventDefault()}
          onDrop={e => handleDrop(e, col.id)}
          className={`bg-dark-800/40 rounded-2xl border ${col.color} p-3 min-h-[300px] flex flex-col`}
        >
          {/* Column header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${col.dot}`} />
              <span className="text-sm font-semibold text-white">{col.label}</span>
              <span className="badge bg-dark-600 text-gray-400 text-xs px-1.5 py-0.5">
                {getColumnTasks(col.id).length}
              </span>
            </div>
          </div>

          {/* Tasks */}
          <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
            <AnimatePresence>
              {getColumnTasks(col.id).map(task => (
                <motion.div
                  key={task._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  draggable
                  onDragStart={() => setDragging(task)}
                  onDragEnd={() => setDragging(null)}
                  onClick={() => onTaskClick?.(task)}
                  className={`bg-dark-700/60 border border-white/8 rounded-xl p-3 cursor-pointer
                    hover:border-brand-500/30 transition-all group
                    ${dragging?._id === task._id ? "opacity-50 scale-95" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-white font-medium leading-snug flex-1">{task.title}</p>
                    {canManage && (
                      <button onClick={() => handleDelete(task._id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-0.5 flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-2.5">
                    <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={10} />
                        {new Date(task.dueDate).toLocaleDateString("en-US", { month:"short", day:"numeric" })}
                      </span>
                    )}
                  </div>

                  {task.assignedTo?.length > 0 && (
                    <div className="flex -space-x-1.5 mt-2">
                      {task.assignedTo.slice(0, 3).map((u, i) => (
                        <div key={u._id || i}
                          className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-500 to-muse-pink border border-dark-700 flex items-center justify-center overflow-hidden"
                        >
                          {u.avatar
                            ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                            : <span className="text-[8px] font-bold text-white">{u.name?.[0]}</span>
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}
