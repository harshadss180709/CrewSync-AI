import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Users, DollarSign, Clock, ArrowRight } from "lucide-react";

const statusColors = {
  draft:       "badge-yellow",
  open:        "badge-cyan",
  in_progress: "badge-purple",
  review:      "badge-yellow",
  completed:   "badge-green",
  cancelled:   "badge-red",
  on_hold:     "badge-yellow",
};

const typeEmoji = {
  music_production: "🎵",
  video_editing:    "🎬",
  graphic_design:   "🎨",
  content_creation: "✍️",
  web_development:  "💻",
  animation:        "✨",
  photography:      "📷",
  podcast:          "🎙️",
  other:            "📁",
};

export default function ProjectCard({ project, index = 0 }) {
  const daysLeft = project.dueDate
    ? Math.ceil((new Date(project.dueDate) - new Date()) / 86400000)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link to={`/projects/${project._id}`} className="block">
        <div className="card-hover p-5 group">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl flex-shrink-0">{typeEmoji[project.projectType] || "📁"}</span>
              <div className="min-w-0">
                <h3 className="font-semibold text-white truncate group-hover:text-brand-400 transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs text-gray-500 capitalize mt-0.5">
                  {project.projectType?.replace("_", " ")}
                </p>
              </div>
            </div>
            <span className={statusColors[project.status] || "badge-yellow"}>
              {project.status?.replace("_", " ")}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-400 line-clamp-2 mb-4">{project.description}</p>

          {/* Progress bar */}
          {project.status === "in_progress" && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{project.completionPercentage || 0}%</span>
              </div>
              <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${project.completionPercentage || 0}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-brand-500 to-muse-violet rounded-full"
                />
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <DollarSign size={12} className="text-green-400" />
              <span>${project.budget?.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users size={12} className="text-brand-400" />
              <span>{project.freelancers?.length || 0} members</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock size={12} className="text-muse-cyan" />
              <span>{project.timeline}</span>
            </div>
            {daysLeft !== null && (
              <div className={`flex items-center gap-1.5 text-xs ${daysLeft < 3 ? "text-red-400" : daysLeft < 7 ? "text-yellow-400" : "text-gray-500"}`}>
                <Calendar size={12} />
                <span>{daysLeft > 0 ? `${daysLeft}d left` : "Overdue"}</span>
              </div>
            )}
          </div>

          {/* Team avatars */}
          {project.freelancers?.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <div className="flex -space-x-2">
                {project.freelancers.slice(0, 4).map((f, i) => (
                  <div key={f._id || i}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-muse-pink border-2 border-dark-800 flex items-center justify-center overflow-hidden"
                    style={{ zIndex: 4 - i }}
                  >
                    {f.avatar
                      ? <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                      : <span className="text-[9px] font-bold text-white">{f.name?.[0]}</span>
                    }
                  </div>
                ))}
                {project.freelancers.length > 4 && (
                  <div className="w-7 h-7 rounded-full bg-dark-600 border-2 border-dark-800 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-gray-400">+{project.freelancers.length - 4}</span>
                  </div>
                )}
              </div>
              <ArrowRight size={14} className="text-gray-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
