import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FolderKanban, DollarSign, BarChart3, Users, Plus, ArrowRight, Zap, TrendingUp, Clock, Brain, Compass, Loader2, Lightbulb } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import StatsCard from "../components/common/StatsCard.jsx";
import ProjectCard from "../components/project/ProjectCard.jsx";
import EarningsChart from "../components/analytics/EarningsChart.jsx";
import { SkeletonStats, SkeletonCard, PageLoader } from "../components/common/LoadingSkeleton.jsx";

export default function Dashboard() {
  const { user, isRole } = useAuth();
  const [analytics,   setAnalytics]   = useState(null);
  const [projects,    setProjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [aiInsights,  setAiInsights]  = useState([]);
  const [insightLoad, setInsightLoad] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsRes, projectsRes] = await Promise.all([
          api.get("/analytics/dashboard"),
          api.get("/projects?limit=4"),
        ]);
        setAnalytics(analyticsRes.data.analytics);
        setProjects(projectsRes.data.projects || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
    fetchInsights(false);
  }, []);

  const INSIGHT_CACHE_KEY = "crewsync_ai_insights";
  const INSIGHT_TTL_MS    = 5 * 60 * 1000; // 5 minutes

  const fetchInsights = async (force = false) => {
    // Return cached value if fresh enough
    if (!force) {
      try {
        const cached = JSON.parse(sessionStorage.getItem(INSIGHT_CACHE_KEY) || "null");
        if (cached && Date.now() - cached.ts < INSIGHT_TTL_MS && cached.data?.length) {
          setAiInsights(cached.data);
          return;
        }
      } catch { /* ignore parse errors */ }
    }

    setInsightLoad(true);
    try {
      const { data } = await api.post("/ai/chat", {
        message: "Give me exactly 3 brief, actionable insights about my projects and workflow. Each insight should be 1 sentence. Reply as JSON array of strings: [\"insight1\",\"insight2\",\"insight3\"]"
      });
      const text   = (data.response || "").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text.slice(text.search(/\[/)));
      if (Array.isArray(parsed) && parsed.length) {
        const insights = parsed.slice(0, 3);
        setAiInsights(insights);
        sessionStorage.setItem(INSIGHT_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: insights }));
      }
    } catch { /* silent — AI is non-critical */ }
    finally { setInsightLoad(false); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) return (
    <div className="space-y-6">
      <SkeletonStats />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}>
          <h1 className="text-2xl font-bold text-white">
            {greeting}, <span className="text-gradient">{user?.name?.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">
            {user?.role} dashboard · {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
          </p>
        </motion.div>

        {isRole("client") && (
          <Link to="/projects/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16}/> New Project
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      {isRole("freelancer") && analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={DollarSign} label="Total Earned"     value={`$${analytics.totalEarned?.toLocaleString()||0}`}    color="green"  index={0} />
          <StatsCard icon={FolderKanban} label="Active Projects" value={analytics.activeProjects||0}                        color="purple" index={1} />
          <StatsCard icon={BarChart3}  label="Tasks Done"        value={analytics.completedTasks||0}                        color="cyan"   index={2} />
          <StatsCard icon={TrendingUp} label="Avg Rating"        value={`${analytics.avgRating?.toFixed(1)||"—"}/5`}        color="yellow" index={3} />
        </div>
      )}

      {isRole("client") && analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={FolderKanban} label="Total Projects"    value={analytics.totalProjects||0}                              color="purple" index={0} />
          <StatsCard icon={DollarSign}   label="Total Spent"        value={`$${analytics.totalSpent?.toLocaleString()||0}`}        color="green"  index={1} />
          <StatsCard icon={Clock}        label="In Escrow"           value={`$${analytics.inEscrow?.toLocaleString()||0}`}          color="yellow" index={2} />
          <StatsCard icon={Users}        label="Active Projects"     value={analytics.activeProjects||0}                            color="cyan"   index={3} />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Earnings / Spend chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">
                {isRole("freelancer") ? "Earnings Trend" : "Spend Trend"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 6 months</p>
            </div>
            <BarChart3 size={16} className="text-gray-600" />
          </div>
          <EarningsChart data={analytics?.earningsTrend || analytics?.spendTrend || []} />
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label:"Browse Freelancers", icon:Users,       to:"/freelancers",  color:"text-cyan-400"   },
              { label:"View Analytics",     icon:BarChart3,    to:"/analytics",    color:"text-brand-400"  },
              { label:"Check Payments",     icon:DollarSign,   to:"/payments",     color:"text-green-400"  },
              { label:"All Projects",       icon:FolderKanban, to:"/projects",     color:"text-muse-pink"  },
            ].map(a=>(
              <Link key={a.to} to={a.to}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/8 transition-all group">
                <div className="flex items-center gap-3">
                  <a.icon size={15} className={a.color}/>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{a.label}</span>
                </div>
                <ArrowRight size={13} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all"/>
              </Link>
            ))}
          </div>

          {/* AI badge */}
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-brand-600/15 to-muse-violet/10 border border-brand-500/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap size={14} className="text-brand-400 animate-pulse"/>
              <span className="text-xs font-semibold text-brand-300">AI Assistant Active</span>
            </div>
            <p className="text-xs text-gray-500">Try the AI Brief Generator in any project workspace.</p>
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      <div className="card p-5 border border-brand-500/20 bg-gradient-to-br from-brand-600/5 to-muse-violet/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-white">AI Insights</h2>
            <span className="text-[10px] bg-brand-600/20 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded-full font-semibold">Gemini</span>
          </div>
          <button onClick={() => fetchInsights(true)} disabled={insightLoad}
            className="text-xs text-gray-500 hover:text-brand-400 transition-colors flex items-center gap-1 disabled:opacity-50">
            {insightLoad ? <Loader2 size={11} className="animate-spin" /> : "↻"} Refresh
          </button>
        </div>
        {insightLoad ? (
          <div className="grid sm:grid-cols-3 gap-3">
            {[0,1,2].map(i => (
              <div key={i} className="h-16 bg-dark-700/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : aiInsights.length > 0 ? (
          <div className="grid sm:grid-cols-3 gap-3">
            {aiInsights.map((ins, i) => (
              <motion.div key={i} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.1 }}
                className="p-3 bg-dark-700/40 rounded-xl border border-white/5 flex items-start gap-2">
                <Lightbulb size={13} className="text-brand-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-300 leading-relaxed">{ins}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-2">No insights yet — add some projects and tasks to get started.</p>
        )}
      </div>

      {/* Discover CTA for freelancers */}
      {isRole("freelancer") && (
        <div className="card p-5 bg-gradient-to-br from-muse-violet/10 to-brand-600/10 border border-brand-500/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-muse-violet flex items-center justify-center flex-shrink-0">
                <Compass size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Discover New Projects</p>
                <p className="text-xs text-gray-500 mt-0.5">AI-curated projects from across the internet matching your skills</p>
              </div>
            </div>
            <Link to="/projects?discover=1"
              className="btn-primary text-xs flex items-center gap-1.5 flex-shrink-0 py-2 px-3 rounded-xl">
              Explore <ArrowRight size={12}/>
            </Link>
          </div>
        </div>
      )}

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title text-lg">Recent Projects</h2>
          <Link to="/projects" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View all <ArrowRight size={14}/>
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="card p-10 text-center">
            <FolderKanban size={36} className="text-gray-600 mx-auto mb-3"/>
            <p className="text-gray-400 font-medium">No projects yet</p>
            <p className="text-sm text-gray-600 mt-1 mb-4">
              {isRole("client") ? "Create your first project and let AI find your team." : "Waiting to be added to a project."}
            </p>
            {isRole("client") && (
              <Link to="/projects" className="btn-primary inline-flex items-center gap-2 text-sm">
                <Plus size={14}/> Create Project
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {projects.map((p, i) => <ProjectCard key={p._id} project={p} index={i}/>)}
          </div>
        )}
      </div>
    </div>
  );
}
