import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, AlertTriangle, CheckCircle2, Clock, DollarSign,
  Users, Zap, RefreshCw, Loader2, Target, Activity, Brain
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

// ── Circular Progress Gauge ───────────────────────────────
function CircularGauge({ value = 0, size = 120, stroke = 10, color = "#7c3aed", label, sublabel }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{Math.round(value)}%</span>
        </div>
      </div>
      {label && <p className="text-xs font-semibold text-white mt-2">{label}</p>}
      {sublabel && <p className="text-[10px] text-gray-500 mt-0.5">{sublabel}</p>}
    </div>
  );
}

// ── Health Badge ──────────────────────────────────────────
const HEALTH_CONFIG = {
  on_track:        { label: "On Track",        color: "text-green-400",  bg: "bg-green-500/15",  border: "border-green-500/30",  icon: CheckCircle2 },
  slightly_behind: { label: "Slightly Behind", color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30", icon: Clock },
  at_risk:         { label: "At Risk",         color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30", icon: AlertTriangle },
  delayed:         { label: "Delayed",         color: "text-red-400",    bg: "bg-red-500/15",    border: "border-red-500/30",    icon: AlertTriangle },
  not_started:     { label: "Not Started",     color: "text-gray-400",   bg: "bg-gray-500/15",   border: "border-gray-500/30",   icon: Clock },
  completed:       { label: "Completed",       color: "text-brand-400",  bg: "bg-brand-500/15",  border: "border-brand-500/30",  icon: CheckCircle2 },
};

function HealthBadge({ status }) {
  const cfg = HEALTH_CONFIG[status] || HEALTH_CONFIG.not_started;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

// ── Activity Heatmap (last 7 days) ────────────────────────
function ActivityHeatmap({ data = [] }) {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1.5">
      {days.map((day, i) => {
        const item = data[i] || { count: 0 };
        const pct = item.count / max;
        const height = Math.max(8, Math.round(pct * 40));
        const opacity = pct < 0.1 ? "opacity-20" : pct < 0.4 ? "opacity-50" : pct < 0.7 ? "opacity-75" : "opacity-100";
        return (
          <div key={day} className="flex flex-col items-center gap-1 flex-1">
            <motion.div
              className={`w-full rounded-sm bg-brand-500 ${opacity}`}
              initial={{ height: 0 }}
              animate={{ height }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              title={`${day}: ${item.count} actions`}
            />
            <span className="text-[9px] text-gray-600">{day[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ProgressTracker({ project }) {
  const [progress,    setProgress]    = useState(null);
  const [aiAnalysis,  setAiAnalysis]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [aiLoading,   setAiLoading]   = useState(false);

  useEffect(() => { if (project?._id) fetchProgress(); }, [project?._id]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/projects/${project._id}/progress`);
      setProgress(data.progress);
    } catch { toast.error("Failed to load progress data"); }
    finally { setLoading(false); }
  };

  const runAIAnalysis = async () => {
    if (!project?._id) return;
    setAiLoading(true);
    try {
      const { data } = await api.post("/ai/analyze-progress", { projectId: project._id });
      setAiAnalysis(data.analysis);
      toast.success("AI analysis complete ✨");
    } catch { toast.error("AI analysis unavailable"); }
    finally { setAiLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-brand-400" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="card p-10 text-center">
        <Activity size={36} className="text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">No progress data yet</p>
        <p className="text-sm text-gray-600 mt-1">Add tasks and milestones to start tracking</p>
      </div>
    );
  }

  const budgetPct = Math.min(progress.budgetUsedPercent || 0, 100);
  const taskPct   = progress.taskCompletion    || 0;
  const milestonePct = progress.milestoneCompletion || 0;

  return (
    <div className="space-y-5">
      {/* Top row — gauges + timeline */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Task completion gauge */}
        <div className="card p-5 flex flex-col items-center justify-center">
          <CircularGauge value={taskPct} color="#7c3aed" label="Task Completion"
            sublabel={`${progress.taskStats?.completed || 0}/${progress.taskStats?.total || 0} tasks`} />
        </div>

        {/* Milestone gauge */}
        <div className="card p-5 flex flex-col items-center justify-center">
          <CircularGauge value={milestonePct} color="#06b6d4" label="Milestones"
            sublabel={`${progress.milestoneStats?.completed || 0}/${progress.milestoneStats?.total || 0} done`} />
        </div>

        {/* Timeline health */}
        <div className="card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Timeline</span>
            <HealthBadge status={progress.timelineStatus} />
          </div>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Time elapsed</span>
                <span className="text-white">{progress.timeProgress || 0}%</span>
              </div>
              <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${progress.timeProgress || 0}%` }}
                  transition={{ duration: 1 }} />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{progress.daysElapsed || 0} days elapsed</span>
              <span>{progress.daysRemaining != null ? (progress.daysRemaining > 0 ? `${progress.daysRemaining}d left` : "Overdue") : "—"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users size={12} />
            <span>{progress.teamSize || 0} team members</span>
          </div>
        </div>
      </div>

      {/* Budget + Activity row */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Budget meter */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign size={15} className="text-green-400" />
              <span className="text-sm font-semibold text-white">Budget</span>
            </div>
            <span className={`text-xs font-semibold ${budgetPct > 90 ? "text-red-400" : budgetPct > 70 ? "text-yellow-400" : "text-green-400"}`}>
              {budgetPct.toFixed(0)}% used
            </span>
          </div>
          <div className="h-3 bg-dark-700 rounded-full overflow-hidden mb-2">
            <motion.div
              className={`h-full rounded-full ${budgetPct > 90 ? "bg-red-500" : budgetPct > 70 ? "bg-yellow-500" : "bg-green-500"}`}
              initial={{ width: 0 }} animate={{ width: `${budgetPct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>${(project.budget * budgetPct / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })} spent</span>
            <span>${(project.budget || 0).toLocaleString()} total</span>
          </div>
        </div>

        {/* Team Activity Heatmap */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-brand-400" />
              <span className="text-sm font-semibold text-white">Team Activity</span>
            </div>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </div>
          <ActivityHeatmap data={progress.recentActivity || []} />
          <p className="text-[10px] text-gray-600 mt-2">
            {(progress.recentActivity || []).reduce((s,d) => s + (d.count||0), 0)} total actions this week
          </p>
        </div>
      </div>

      {/* Task breakdown */}
      {progress.taskStats && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target size={15} className="text-brand-400" />
            <span className="text-sm font-semibold text-white">Task Breakdown</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "To Do",      count: progress.taskStats.todo        || 0, color: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/20"   },
              { label: "In Progress",count: progress.taskStats.in_progress || 0, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
              { label: "Review",     count: progress.taskStats.review      || 0, color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20"   },
              { label: "Completed",  count: progress.taskStats.completed   || 0, color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20"  },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 border ${s.bg} ${s.border}`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottlenecks */}
      {progress.bottlenecks?.length > 0 && (
        <div className="card p-5 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-orange-400" />
            <span className="text-sm font-semibold text-white">Detected Bottlenecks</span>
          </div>
          <ul className="space-y-2">
            {progress.bottlenecks.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                <span className="text-orange-400 mt-0.5 flex-shrink-0">▸</span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Analysis Panel */}
      <div className="card p-5 border border-brand-500/20 bg-gradient-to-br from-brand-600/5 to-muse-violet/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain size={15} className="text-brand-400" />
            <span className="text-sm font-semibold text-white">AI Health Analysis</span>
          </div>
          <button onClick={runAIAnalysis} disabled={aiLoading}
            className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 border border-brand-500/30 bg-brand-600/10 hover:bg-brand-600/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
            {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {aiLoading ? "Analyzing…" : "Run Analysis"}
          </button>
        </div>

        {aiAnalysis ? (
          <div className="space-y-4">
            {/* Health Score */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg width="64" height="64" className="-rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <motion.circle cx="32" cy="32" r="26" fill="none"
                    stroke={aiAnalysis.healthScore > 70 ? "#22c55e" : aiAnalysis.healthScore > 40 ? "#eab308" : "#ef4444"}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 26}
                    initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - aiAnalysis.healthScore / 100) }}
                    transition={{ duration: 1.2 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{aiAnalysis.healthScore}</span>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold">Health Score</p>
                <HealthBadge status={aiAnalysis.riskLevel === "low" ? "on_track" : aiAnalysis.riskLevel === "medium" ? "at_risk" : "delayed"} />
                {aiAnalysis.estimatedCompletion && (
                  <p className="text-xs text-gray-500 mt-1">Est. completion: {aiAnalysis.estimatedCompletion}</p>
                )}
              </div>
            </div>

            {/* Bottlenecks */}
            {aiAnalysis.bottlenecks?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Issues Detected</p>
                <ul className="space-y-1.5">
                  {aiAnalysis.bottlenecks.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <AlertTriangle size={11} className="text-orange-400 mt-0.5 flex-shrink-0" />{b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {aiAnalysis.suggestions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Recommendations</p>
                <ul className="space-y-1.5">
                  {aiAnalysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <Zap size={11} className="text-brand-400 mt-0.5 flex-shrink-0" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Insights */}
            {aiAnalysis.insights?.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-2">
                {aiAnalysis.insights.map((ins, i) => (
                  <div key={i} className="p-3 bg-dark-700/50 rounded-xl border border-white/5 text-xs text-gray-400">
                    {ins}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <TrendingUp size={28} className="text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Click "Run Analysis" to get AI-powered health insights for this project.</p>
          </div>
        )}
      </div>

      {/* Refresh */}
      <div className="flex justify-end">
        <button onClick={fetchProgress} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1.5 transition-colors">
          <RefreshCw size={11} /> Refresh data
        </button>
      </div>
    </div>
  );
}
