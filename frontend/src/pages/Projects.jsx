import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, X, FolderKanban, Zap, Loader, Compass, Loader2, DollarSign, Clock, MapPin, CheckCircle2, Globe, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import ProjectCard from "../components/project/ProjectCard.jsx";
import Modal from "../components/common/Modal.jsx";
import { SkeletonCard } from "../components/common/LoadingSkeleton.jsx";
import toast from "react-hot-toast";

const PROJECT_TYPES = ["music_production","video_editing","graphic_design","content_creation","web_development","animation","podcast","other"];
const STATUSES      = ["open","in_progress","review","completed","on_hold"];

const emptyForm = {
  title:"", description:"", projectType:"music_production",
  budget:"", timeline:"", dueDate:"", priority:"medium",
  requiredSkills:[], mood:"", style:"",
};

const URGENCY_COLOR = { high: "text-red-400", medium: "text-yellow-400", low: "text-green-400" };

function DiscoverCard({ job, onApply, isApplying, hasApplied }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5 hover:border-brand-500/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">
              {job.title}
            </h3>
            {job.verified && (
              <CheckCircle2 size={13} className="text-green-400 flex-shrink-0" title="Verified client" />
            )}
          </div>
          <p className="text-xs text-gray-500 line-clamp-2">{job.description}</p>
        </div>
        <div className="text-xs font-bold px-2 py-1 rounded-lg bg-brand-600/20 text-brand-400 border border-brand-500/30 flex-shrink-0">
          {job.matchScore}% match
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.requiredSkills?.slice(0, 4).map(s => (
          <span key={s} className="text-[10px] bg-dark-700 border border-white/8 text-gray-400 px-2 py-0.5 rounded-md">
            {s}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3 flex-wrap gap-2">
        <span className="flex items-center gap-1">
          <DollarSign size={11} />
          {job.budgetMin && job.budgetMax
            ? `$${job.budgetMin.toLocaleString()} – $${job.budgetMax.toLocaleString()}`
            : job.budget}
        </span>
        <span className="flex items-center gap-1"><Clock size={11} /> {job.deadline}</span>
        {job.location && <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>}
        {job.proposals != null && <span>{job.proposals} proposals</span>}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {job._fromDB
            ? <span className="text-[10px] bg-dark-600 border border-white/10 text-gray-400 px-1.5 py-0.5 rounded flex-shrink-0">
                CrewSync
              </span>
            : <><Globe size={11} className="text-gray-600 flex-shrink-0" />
               <span className="text-[10px] text-gray-600 truncate">{job.source}</span></>
          }
          <span className="text-[10px] text-gray-600 truncate">{job.postedTime}</span>
          {job.urgency && job.urgency !== "normal" && (
            <span className={`text-[10px] font-semibold flex-shrink-0 ${URGENCY_COLOR[job.urgency]}`}>
              ● {job.urgency.replace("_", " ")}
            </span>
          )}
        </div>

        <button
          onClick={() => onApply(job)}
          disabled={isApplying || hasApplied}
          className={`
            flex-shrink-0 flex items-center gap-1.5
            text-xs px-3 py-1.5 rounded-lg border
            transition-all duration-150 disabled:cursor-not-allowed
            ${hasApplied
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-brand-600/20 hover:bg-brand-600/40 border-brand-500/30 text-brand-400"}
          `}
        >
          {isApplying ? (
            <><Loader2 size={11} className="animate-spin" /> Sending…</>
          ) : hasApplied ? (
            <><CheckCircle2 size={11} /> Sent</>
          ) : (
            <><Send size={11} /> Express Interest</>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const { user, isRole } = useAuth();
  const location = useLocation();
  const [activeTab,    setActiveTab]    = useState(
    location.search.includes("discover=1") && isRole?.("freelancer") ? "discover" : "my"
  );
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState(emptyForm);
  const [saving,    setSaving]    = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [search,    setSearch]    = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType,   setFilterType]   = useState("");

  // Discover state
  const [discovered,    setDiscovered]    = useState([]);
  const [discovering,   setDiscovering]   = useState(false);

  const discoverProjects = async () => {
    setDiscovering(true);
    try {
      const { data } = await api.post("/ai/discover-projects", {
        skills: user?.skills || [],
        role: user?.role,
        preferredBudget: null,
      });
      setDiscovered(data.projects || []);
      if (data.source === "fallback") {
        toast(`Found ${(data.projects||[]).length} real open projects — AI curation temporarily offline.`, { icon: "🗄️" });
      } else {
        toast.success(`Found ${(data.projects||[]).length} AI-curated projects`);
      }
    } catch { toast.error("Discovery unavailable"); }
    finally { setDiscovering(false); }
  };

  // Track which jobs the user already applied to (prevents double-clicks)
  const [applied, setApplied] = useState(new Set());
  const [applying, setApplying] = useState(null); // jobId currently submitting

  const handleApply = async (job) => {
    if (applied.has(job.id)) {
      toast("You already expressed interest in this project.", { icon: "ℹ️" });
      return;
    }

    setApplying(job.id);
    try {
      // DB-backed projects have a real MongoDB ObjectId as their id
      if (job._fromDB) {
        await api.post(`/projects/${job.id}/interest`);
        setApplied(prev => new Set([...prev, job.id]));
        toast.success(`Interest sent for "${job.title}" — check your notifications.`);
      } else {
        // AI-generated listing — no real project in DB; just confirm to the user
        setApplied(prev => new Set([...prev, job.id]));
        toast.success(`Interest noted for "${job.title}".\nThis is an external listing from ${job.source} — apply directly via their platform.`, {
          duration: 5000,
        });
      }
    } catch (err) {
      if (err?.status === 409 || err?.success === false) {
        // Already expressed interest (409 from backend)
        setApplied(prev => new Set([...prev, job.id]));
        toast("You've already expressed interest in this project.", { icon: "ℹ️" });
      } else {
        toast.error(err?.message || "Failed to submit interest. Please try again.");
      }
    } finally {
      setApplying(null);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)       params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      if (filterType)   params.set("type",   filterType);
      const { data } = await api.get(`/projects?${params}`);
      setProjects(data.projects || []);
    } catch { toast.error("Failed to load projects"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterStatus, filterType]);

  const generateBrief = async () => {
    if (!form.title || !form.description) return toast.error("Add title & description first.");
    setAiLoading(true);
    try {
      const { data } = await api.post("/ai/estimate", {
        title:form.title, projectType:form.projectType,
        requiredSkills:form.requiredSkills, description:form.description
      });
      const e = data.estimate;
      setForm(p=>({ ...p,
        budget:   e.estimatedBudgetMin || p.budget,
        timeline: `${e.estimatedDays} days`,
      }));
      if (data.source === "fallback") {
        toast("Estimate based on project type rules — AI unavailable right now.", { icon: "📐" });
      } else {
        toast.success("AI estimated budget & timeline ✨");
      }
    } catch { toast.error("AI unavailable"); }
    finally { setAiLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/projects", {
        ...form,
        budget:   Number(form.budget),
        dueDate:  form.dueDate || new Date(Date.now() + 30*86400000).toISOString(),
      });
      setProjects(p => [data.project, ...p]);
      setShowModal(false);
      setForm(emptyForm);
      toast.success("Project created! 🎉");
    } catch (err) { toast.error(err?.message || "Failed to create"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {activeTab === "my" ? `${projects.length} total · manage your creative work` : "AI-matched opportunities from across the internet"}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {isRole("client","admin") && (
            <button onClick={()=>setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16}/> New Project
            </button>
          )}
        </div>
      </div>

      {/* Tab switcher (freelancer only) */}
      {isRole("freelancer") && (
        <div className="flex gap-1 p-1 bg-dark-800/60 rounded-xl border border-white/8 w-fit">
          <button onClick={() => setActiveTab("my")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab==="my" ? "bg-brand-600 text-white shadow-glow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
            <FolderKanban size={14}/> My Projects
          </button>
          <button onClick={() => { setActiveTab("discover"); if (!discovered.length) discoverProjects(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab==="discover" ? "bg-brand-600 text-white shadow-glow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
            <Compass size={14}/> Discover
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
      {activeTab === "discover" ? (
        <motion.div key="discover" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
          className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{discovered.length} opportunities found for your skills</p>
            <button onClick={discoverProjects} disabled={discovering}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 rounded-xl">
              {discovering ? <Loader2 size={12} className="animate-spin"/> : <Zap size={12} className="text-brand-400"/>}
              {discovering ? "Searching…" : "Refresh Results"}
            </button>
          </div>

          {discovering ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>)}
            </div>
          ) : discovered.length === 0 ? (
            <div className="card p-14 text-center">
              <Compass size={40} className="text-gray-600 mx-auto mb-3"/>
              <p className="text-gray-400 font-medium">No results yet</p>
              <p className="text-sm text-gray-600 mt-1 mb-4">Let AI search for projects matching your skills</p>
              <button onClick={discoverProjects} className="btn-primary inline-flex items-center gap-2 text-sm">
                <Zap size={14}/> Search Projects
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {discovered.map((job, i) => (
                <DiscoverCard
                  key={job.id || i}
                  job={job}
                  onApply={handleApply}
                  isApplying={applying === job.id}
                  hasApplied={applied.has(job.id)}
                />
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div key="my" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
          className="space-y-4">

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search projects…"
            className="input-field pl-9 py-2 text-sm" />
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          className="input-field py-2 text-sm w-auto px-3 pr-8">
          <option value="">All Status</option>
          {STATUSES.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
        <select value={filterType} onChange={e=>setFilterType(e.target.value)}
          className="input-field py-2 text-sm w-auto px-3 pr-8">
          <option value="">All Types</option>
          {PROJECT_TYPES.map(t=><option key={t} value={t}>{t.replace("_"," ")}</option>)}
        </select>
        {(filterStatus||filterType||search) && (
          <button onClick={()=>{setSearch("");setFilterStatus("");setFilterType("");}}
            className="btn-ghost text-xs flex items-center gap-1 py-2 text-red-400 hover:text-red-300">
            <X size={13}/> Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({length:6}).map((_,i)=><SkeletonCard key={i}/>)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-14 text-center">
          <FolderKanban size={40} className="text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400 font-medium">No projects found</p>
          <p className="text-sm text-gray-600 mt-1">
            {isRole("client") ? "Create your first project to get started." : "You haven't been added to any project yet."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((p,i)=><ProjectCard key={p._id} project={p} index={i}/>)}
        </div>
      )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Create modal */}
      <Modal isOpen={showModal} onClose={()=>setShowModal(false)} title="Create New Project" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Project Title *</label>
              <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}
                placeholder="e.g. Emotional Cinematic EP Campaign" className="input-field" required/>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Description *</label>
              <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}
                placeholder="Describe your project vision, goals, and requirements…"
                rows={3} className="input-field resize-none" required/>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Project Type</label>
              <select value={form.projectType} onChange={e=>setForm(p=>({...p,projectType:e.target.value}))}
                className="input-field">
                {PROJECT_TYPES.map(t=><option key={t} value={t}>{t.replace("_"," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Priority</label>
              <select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}
                className="input-field">
                {["low","medium","high","critical"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Budget (USD) *</label>
              <input type="number" value={form.budget} onChange={e=>setForm(p=>({...p,budget:e.target.value}))}
                placeholder="5000" min="1" className="input-field" required/>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Timeline</label>
              <input value={form.timeline} onChange={e=>setForm(p=>({...p,timeline:e.target.value}))}
                placeholder="e.g. 3 weeks" className="input-field"/>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))}
                min={new Date().toISOString().split("T")[0]} className="input-field"/>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Mood / Style</label>
              <input value={form.mood} onChange={e=>setForm(p=>({...p,mood:e.target.value}))}
                placeholder="e.g. Cinematic, Dark, Upbeat" className="input-field"/>
            </div>
          </div>

          {/* AI estimate button */}
          <button type="button" onClick={generateBrief} disabled={aiLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-500/30 bg-brand-600/10 text-brand-300 text-sm hover:bg-brand-600/20 transition-colors disabled:opacity-50">
            {aiLoading ? <Loader size={14} className="animate-spin"/> : <Zap size={14}/>}
            {aiLoading ? "AI Estimating…" : "✨ AI Estimate Budget & Timeline"}
          </button>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={()=>setShowModal(false)} className="btn-secondary flex-1 py-3 rounded-xl">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 rounded-xl flex items-center justify-center gap-2">
              {saving ? <Loader size={14} className="animate-spin"/> : null}
              {saving ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
