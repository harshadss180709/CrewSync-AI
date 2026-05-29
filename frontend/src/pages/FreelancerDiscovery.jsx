import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Zap, X, Loader, Users } from "lucide-react";
import api from "../services/api.js";
import FreelancerCard from "../components/freelancer/FreelancerCard.jsx";
import Modal from "../components/common/Modal.jsx";
import { SkeletonCard } from "../components/common/LoadingSkeleton.jsx";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";

const SKILLS = ["Music Production","Video Editing","Graphic Design","Motion Graphics","Photography","Songwriting","3D Animation","Web Development","Copywriting","Sound Design"];

export default function FreelancerDiscovery() {
  const { isRole } = useAuth();
  const [freelancers,   setFreelancers]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [skill,         setSkill]         = useState("");
  const [availability,  setAvailability]  = useState("");
  const [minRating,     setMinRating]     = useState("");

  // AI allocate
  const [showAI,     setShowAI]     = useState(false);
  const [projects,   setProjects]   = useState([]);
  const [selProject, setSelProject] = useState("");
  const [aiResults,  setAiResults]  = useState([]);
  const [aiLoading,  setAiLoading]  = useState(false);

  // ── Debounced search: only fire API after 400ms of no typing ──
  const debounceRef = useRef(null);

  const load = async (searchVal, skillVal, availVal, ratingVal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchVal) params.set("search",       searchVal);
      if (skillVal)  params.set("skills",        skillVal);
      if (availVal)  params.set("availability",  availVal);
      if (ratingVal) params.set("minRating",     ratingVal);
      const { data } = await api.get(`/users/freelancers?${params}`);
      setFreelancers(data.freelancers || []);
    } catch { toast.error("Failed to load freelancers"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(search, skill, availability, minRating);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search, skill, availability, minRating]);

  useEffect(() => {
    if (isRole("client","admin")) {
      api.get("/projects?status=open&limit=20").then(r => setProjects(r.data.projects||[])).catch(()=>{});
    }
  }, []);

  const runAIAllocation = async () => {
    if (!selProject) return toast.error("Select a project first.");
    setAiLoading(true);
    try {
      const proj     = projects.find(p=>p._id===selProject);
      const { data } = await api.post("/ai/allocate", {
        projectId:      selProject,
        requiredSkills: proj?.requiredSkills || [],
      });
      setAiResults(data.recommendations || []);
      if (!data.recommendations?.length) toast("No matches found for this project.");
    } catch { toast.error("AI service error"); }
    finally { setAiLoading(false); }
  };

  const clearFilters = () => { setSearch(""); setSkill(""); setAvailability(""); setMinRating(""); };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Discover Freelancers</h1>
          <p className="text-gray-500 text-sm mt-0.5">{freelancers.length} creative professionals available</p>
        </div>
        {isRole("client","admin") && (
          <button onClick={()=>setShowAI(true)}
            className="btn-primary flex items-center gap-2 text-sm self-start">
            <Zap size={15}/> AI Team Allocator
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name or skill…" className="input-field pl-9 py-2 text-sm"/>
        </div>
        <select value={skill} onChange={e=>setSkill(e.target.value)}
          className="input-field py-2 text-sm w-auto px-3 pr-8">
          <option value="">All Skills</option>
          {SKILLS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={availability} onChange={e=>setAvailability(e.target.value)}
          className="input-field py-2 text-sm w-auto px-3 pr-8">
          <option value="">Any Availability</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
        </select>
        <select value={minRating} onChange={e=>setMinRating(e.target.value)}
          className="input-field py-2 text-sm w-auto px-3 pr-8">
          <option value="">Any Rating</option>
          <option value="4">4★ & above</option>
          <option value="4.5">4.5★ & above</option>
        </select>
        {(search||skill||availability||minRating) && (
          <button onClick={clearFilters} className="btn-ghost text-xs flex items-center gap-1 py-2 text-red-400">
            <X size={13}/> Clear
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({length:8}).map((_,i)=><SkeletonCard key={i}/>)}
        </div>
      ) : freelancers.length === 0 ? (
        <div className="card p-14 text-center">
          <Users size={40} className="text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400 font-medium">No freelancers found</p>
          <p className="text-sm text-gray-600 mt-1">Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {freelancers.map((f,i)=><FreelancerCard key={f._id} freelancer={f} index={i}/>)}
        </div>
      )}

      {/* AI Allocator Modal */}
      <Modal isOpen={showAI} onClose={()=>setShowAI(false)} title="✨ AI Team Allocator" size="xl">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-brand-600/15 to-muse-violet/10 border border-brand-500/20">
            <p className="text-sm text-gray-300">
              Select a project and let Gemini AI analyse your requirements to recommend the best team.
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Select Project</label>
            <select value={selProject} onChange={e=>setSelProject(e.target.value)} className="input-field">
              <option value="">Choose a project…</option>
              {projects.map(p=><option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </div>

          <button onClick={runAIAllocation} disabled={aiLoading||!selProject}
            className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2">
            {aiLoading ? <><Loader size={15} className="animate-spin"/>Analysing freelancers…</>
                       : <><Zap size={15}/>Run AI Allocation</>}
          </button>

          {aiResults.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                🎯 AI Recommendations ({aiResults.length} matches)
              </h3>
              <div className="space-y-3">
                {aiResults.map((r,i) => {
                  const f = freelancers.find(fl=>fl._id===r.freelancerId) || { name: r.freelancerId, skills:[] };
                  return (
                    <motion.div key={i} initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay: i*0.1 }}
                      className="flex items-start gap-3 p-4 rounded-xl bg-dark-700/60 border border-white/8">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-muse-pink flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-white">{f.name?.[0]||"?"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{f.name}</p>
                          <span className="badge-purple text-[10px]">{r.compatibilityScore}% match</span>
                          <span className="badge-green text-[10px]">{r.successRate}% success rate</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{r.reason}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
