import { motion } from "framer-motion";

export default function StatsCard({ icon: Icon, label, value, sub, color = "purple", trend, index = 0 }) {
  const colors = {
    purple: { bg: "from-brand-600/20 to-muse-purple/20", border: "border-brand-500/20", icon: "text-brand-400", glow: "shadow-glow-sm" },
    cyan:   { bg: "from-muse-cyan/20 to-blue-500/20",    border: "border-cyan-500/20",   icon: "text-cyan-400",  glow: "" },
    green:  { bg: "from-green-500/20 to-emerald-500/20", border: "border-green-500/20",  icon: "text-green-400", glow: "" },
    yellow: { bg: "from-yellow-500/20 to-orange-500/20", border: "border-yellow-500/20", icon: "text-yellow-400",glow: "" },
    pink:   { bg: "from-pink-500/20 to-rose-500/20",     border: "border-pink-500/20",   icon: "text-pink-400",  glow: "" },
  };
  const c = colors[color] || colors.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`card p-5 bg-gradient-to-br ${c.bg} border ${c.border} ${c.glow} hover:scale-[1.02] transition-transform duration-200`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white truncate">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1 truncate">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-dark-700/60 flex items-center justify-center flex-shrink-0 ml-3`}>
          <Icon size={20} className={c.icon} />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`mt-3 flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
          <span>{trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%</span>
          <span className="text-gray-500">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}
