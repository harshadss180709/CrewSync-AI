import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, DollarSign, Target, Clock, Shield, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import EarningsChart from "../components/analytics/EarningsChart.jsx";
import StatsCard from "../components/common/StatsCard.jsx";
import { SkeletonStats, PageLoader } from "../components/common/LoadingSkeleton.jsx";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">{payload[0]?.value}</p>
    </div>
  );
};

export default function Analytics() {
  const { user, isRole } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/dashboard").then(r => setData(r.data.analytics)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const radarData = isRole("freelancer") && data ? [
    { subject:"Quality",       A: data.avgRating ? data.avgRating * 20 : 0 },
    { subject:"Reliability",   A: user.reliabilityScore || 0 },
    { subject:"Delivery",      A: Math.min(100, (data.completedTasks||0) * 5) },
    { subject:"Collaboration", A: Math.min(100, (data.contributions||0) * 10) },
    { subject:"Earnings",      A: Math.min(100, ((data.totalEarned||0) / 500)) },
  ] : [];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">Performance insights & metrics</p>
      </div>

      {/* Stats */}
      {isRole("freelancer") && data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={DollarSign} label="Total Earned"      value={`$${data.totalEarned?.toLocaleString()||0}`}   color="green"  index={0}/>
          <StatsCard icon={Target}     label="Contribution Score"value={data.avgContributionScore?.toFixed(0)||0}       color="purple" index={1}/>
          <StatsCard icon={Star}       label="Avg Rating"         value={`${data.avgRating?.toFixed(1)||"—"}/5`}        color="yellow" index={2}/>
          <StatsCard icon={Shield}     label="Reliability"        value={`${user.reliabilityScore||0}%`}               color="cyan"   index={3}/>
        </div>
      )}

      {isRole("client") && data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={DollarSign}  label="Total Spent"       value={`$${data.totalSpent?.toLocaleString()||0}`}         color="green"  index={0}/>
          <StatsCard icon={TrendingUp}  label="Completed Projects" value={data.completedProjects||0}                         color="purple" index={1}/>
          <StatsCard icon={Clock}       label="Avg Duration"       value={`${data.avgProjectDuration||0}d`}                  color="cyan"   index={2}/>
          <StatsCard icon={Star}        label="Avg Team Rating"    value={`${data.avgFreelancerRating?.toFixed(1)||"—"}/5`}   color="yellow" index={3}/>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Earnings / Spend trend */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="text-sm font-semibold text-white mb-1">
            {isRole("freelancer") ? "Earnings History" : "Spending History"}
          </h2>
          <p className="text-xs text-gray-500 mb-4">Monthly breakdown over the last 6 months</p>
          <EarningsChart data={data?.earningsTrend || data?.spendTrend || []} />
        </div>

        {/* Radar chart (freelancer) */}
        {isRole("freelancer") && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Performance Radar</h2>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill:"#6b7280", fontSize:10 }} />
                <Radar dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Client project breakdown */}
        {isRole("client") && data && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Project Status</h2>
            <div className="space-y-3">
              {[
                { label:"Active",    value: data.activeProjects||0,    color:"bg-brand-500"  },
                { label:"Completed", value: data.completedProjects||0,  color:"bg-green-500"  },
                { label:"Delayed",   value: data.delayedProjects||0,    color:"bg-red-500"    },
              ].map(s=>(
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-16">{s.label}</span>
                  <div className="flex-1 h-2 bg-dark-600 rounded-full overflow-hidden">
                    <motion.div animate={{ width:`${Math.min(100, s.value*20)}%` }}
                      transition={{ duration:1 }} className={`h-full ${s.color} rounded-full`}/>
                  </div>
                  <span className="text-xs text-white font-medium w-4 text-right">{s.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/8">
              <p className="text-xs text-gray-500">Team Productivity</p>
              <div className="flex items-end gap-1 mt-1">
                <span className="text-2xl font-bold text-white">{data.teamProductivity||0}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity summary */}
      {isRole("freelancer") && data && (
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label:"Tasks Completed",  value: data.completedTasks||0,   icon:"✅" },
            { label:"Active Projects",  value: data.activeProjects||0,   icon:"📁" },
            { label:"Total Contributions",value:data.contributions||0,  icon:"⚡" },
          ].map((s,i)=>(
            <motion.div key={i} initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.1 }}
              className="card p-5 text-center hover:border-brand-500/20 transition-colors">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
