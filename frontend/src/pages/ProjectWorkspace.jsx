import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageSquare, Kanban, Users, FileUp, BarChart3,
  Zap, Plus, Settings, ArrowLeft, Loader, Bot, Flag, TrendingUp
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import api from "../services/api.js";
import TaskBoard from "../components/project/TaskBoard.jsx";
import CollaborationChat from "../components/project/CollaborationChat.jsx";
import ContributionChart from "../components/analytics/ContributionChart.jsx";
import MilestoneManager from "../components/project/MilestoneManager.jsx";
import ProgressTracker from "../components/project/ProgressTracker.jsx";
import TaskDetailModal from "../components/project/TaskDetailModal.jsx";
import FileUpload from "../components/common/FileUpload.jsx";
import Modal from "../components/common/Modal.jsx";
import { PageLoader } from "../components/common/LoadingSkeleton.jsx";
import toast from "react-hot-toast";

const TABS = [
  { id:"board",         label:"Task Board",      icon: Kanban        },
  { id:"chat",          label:"Team Chat",        icon: MessageSquare },
  { id:"milestones",    label:"Milestones",       icon: Flag          },
  { id:"progress",      label:"Progress",         icon: TrendingUp    },
  { id:"contributions", label:"Contributions",    icon: BarChart3     },
  { id:"files",         label:"Files",            icon: FileUp        },
  { id:"team",          label:"Team",             icon: Users         },
];

export default function ProjectWorkspace() {
  const { id }               = useParams();
  const { user, isRole }     = useAuth();
  const { joinProject, leaveProject, on, off } = useSocket();
  const navigate             = useNavigate();

  const [project,       setProject]       = useState(null);
  const [tasks,         setTasks]         = useState([]);
  const [contributions, setContributions] = useState([]);
  const [tab,           setTab]           = useState("board");
  const [loading,       setLoading]       = useState(true);
  const [showAddTask,   setShowAddTask]   = useState(false);
  const [showAIBrief,   setShowAIBrief]   = useState(false);
  const [showUpload,    setShowUpload]    = useState(false);
  const [selectedTask,  setSelectedTask]  = useState(null);
  const [taskForm,      setTaskForm]      = useState({ title:"", description:"", priority:"medium", assignedTo:[], dueDate:"", category:"other" });
  const [brief,         setBrief]         = useState(null);
  const [aiBriefLoading,setAiBriefLoading]= useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, contribRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/contributions/project/${id}`),
        ]);
        setProject(projRes.data.project);
        setTasks(projRes.data.tasks || []);
        setContributions(contribRes.data.contributions || []);
      } catch { toast.error("Failed to load project"); navigate("/projects"); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!project) return;
    joinProject(id);
    const onTaskUpdated = (t) => setTasks(prev => prev.map(x => x._id === t._id ? t : x));
    const onTaskDeleted = ({ taskId }) => setTasks(prev => prev.filter(t => t._id !== taskId));
    on("task:updated", onTaskUpdated);
    on("task:deleted", onTaskDeleted);
    return () => {
      leaveProject(id);
      off("task:updated", onTaskUpdated);
      off("task:deleted", onTaskDeleted);
    };
  }, [project, id]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/tasks", { ...taskForm, project: id });
      setTasks(p => [...p, data.task]);
      setShowAddTask(false);
      setTaskForm({ title:"", description:"", priority:"medium", assignedTo:[], dueDate:"", category:"other" });
      toast.success("Task added");
    } catch { toast.error("Failed to add task"); }
  };

  const generateAIBrief = async () => {
    if (!project) return;
    setAiBriefLoading(true);
    try {
      const { data } = await api.post("/ai/brief", {
        projectIdea: project.description,
        projectType: project.projectType,
        budget:      project.budget,
        timeline:    project.timeline,
      });
      setBrief(data.brief);
      setShowAIBrief(true);
      if (data.source === "fallback") {
        toast("Brief generated from project template — Gemini AI temporarily offline.", { icon: "📋" });
      } else {
        toast.success("AI brief generated ✨");
      }
    } catch { toast.error("AI service unavailable"); }
    finally { setAiBriefLoading(false); }
  };

  const isClient = project?.client?._id === user?._id || project?.client === user?._id;
  const canManage = isClient || isRole("admin");

  if (loading) return <PageLoader />;
  if (!project) return null;

  return (
    <div className="space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <button onClick={()=>navigate("/projects")} className="btn-ghost p-2 rounded-xl flex-shrink-0 mt-0.5">
            <ArrowLeft size={16}/>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white truncate">{project.title}</h1>
              <span className="badge-purple text-xs">{project.status?.replace("_"," ")}</span>
              {project.analytics?.delayRisk === "high" && (
                <span className="badge-red text-xs">⚠ High Delay Risk</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{project.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Progress */}
          <div className="hidden md:flex items-center gap-2 card px-3 py-2">
            <div className="w-24 h-1.5 bg-dark-600 rounded-full overflow-hidden">
              <motion.div animate={{ width:`${project.completionPercentage||0}%` }}
                className="h-full bg-gradient-to-r from-brand-500 to-muse-violet rounded-full"/>
            </div>
            <span className="text-xs text-gray-400">{project.completionPercentage||0}%</span>
          </div>

          <button onClick={generateAIBrief} disabled={aiBriefLoading}
            className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 rounded-xl">
            {aiBriefLoading ? <Loader size={13} className="animate-spin"/> : <Zap size={13} className="text-brand-400"/>}
            AI Brief
          </button>
          {canManage && (
            <button onClick={()=>setShowAddTask(true)} className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3 rounded-xl">
              <Plus size={13}/> Task
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-dark-800/60 rounded-xl border border-white/8 w-fit overflow-x-auto no-scrollbar">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap
              ${tab===t.id ? "bg-brand-600 text-white shadow-glow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
            <t.icon size={13}/> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div key={tab} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}>
        {tab === "board" && (
          <TaskBoard tasks={tasks} projectId={id} canManage={canManage}
            onTaskClick={t => setSelectedTask(t)}
            onTaskUpdated={t => setTasks(p=>p.map(x=>x._id===t._id?t:x))}
            onTaskDeleted={tid => setTasks(p=>p.filter(t=>t._id!==tid))} />
        )}

        {tab === "milestones" && (
          <MilestoneManager project={project} />
        )}

        {tab === "progress" && (
          <ProgressTracker project={project} />
        )}

        {tab === "chat" && (
          <div className="h-[calc(100vh-280px)] min-h-80">
            <CollaborationChat projectId={id} />
          </div>
        )}

        {tab === "contributions" && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Contribution Breakdown</h3>
              <ContributionChart contributions={contributions} />
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Team Scores</h3>
              <div className="space-y-3">
                {contributions.map((c,i) => (
                  <div key={c._id||i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-muse-pink flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {c.freelancer?.avatar
                        ? <img src={c.freelancer.avatar} alt="" className="w-full h-full object-cover"/>
                        : <span className="text-xs font-bold text-white">{c.freelancer?.name?.[0]}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white font-medium truncate">{c.freelancer?.name}</span>
                        <span className="text-brand-400 flex-shrink-0 ml-2">{c.percentage||c.contributionPercentage||0}%</span>
                      </div>
                      <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <motion.div animate={{ width:`${c.percentage||c.contributionPercentage||0}%` }}
                          transition={{ duration:1, delay:i*0.1 }}
                          className="h-full bg-gradient-to-r from-brand-500 to-muse-violet rounded-full"/>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {c.tasksCompleted} tasks · {c.filesUploaded} files · {c.messagesCount} messages
                      </p>
                    </div>
                  </div>
                ))}
                {!contributions.length && (
                  <p className="text-sm text-gray-500 text-center py-6">No contributions tracked yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "files" && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Project Files</h3>
              <button onClick={() => setShowUpload(true)}
                className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3 rounded-xl">
                <Plus size={13}/> Upload File
              </button>
            </div>
            {project.files?.length === 0 ? (
              <div className="text-center py-10">
                <FileUp size={32} className="text-gray-600 mx-auto mb-2"/>
                <p className="text-gray-500 text-sm">No files uploaded yet.</p>
                <button onClick={() => setShowUpload(true)} className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
                  <Plus size={14}/> Upload First File
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {project.files?.map((f,i) => (
                  <a key={i} href={f.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                    <div className="w-9 h-9 bg-dark-600 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">
                      {f.fileType?.includes("image") ? "🖼️" : f.fileType?.includes("audio") ? "🎵" : f.fileType?.includes("video") ? "🎬" : "📄"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate group-hover:text-brand-400 transition-colors">{f.name}</p>
                      <p className="text-xs text-gray-500">{new Date(f.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "team" && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Team Members</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {/* Client */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/40 border border-white/8">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-brand-500 to-muse-pink flex items-center justify-center">
                  {project.client?.avatar
                    ? <img src={project.client.avatar} alt="" className="w-full h-full object-cover"/>
                    : <span className="font-bold text-white text-sm">{project.client?.name?.[0]}</span>
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{project.client?.name}</p>
                  <span className="badge-purple text-[10px]">Client</span>
                </div>
              </div>
              {/* Freelancers */}
              {project.freelancers?.map((f,i) => (
                <div key={f._id||i} className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/40 border border-white/8">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-muse-cyan to-brand-600 flex items-center justify-center">
                    {f.avatar
                      ? <img src={f.avatar} alt="" className="w-full h-full object-cover"/>
                      : <span className="font-bold text-white text-sm">{f.name?.[0]}</span>
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {f.skills?.slice(0,2).map(s=>(
                        <span key={s} className="text-[10px] text-gray-500">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Add Task Modal */}
      <Modal isOpen={showAddTask} onClose={()=>setShowAddTask(false)} title="Add New Task" size="md">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Task Title *</label>
            <input value={taskForm.title} onChange={e=>setTaskForm(p=>({...p,title:e.target.value}))}
              placeholder="e.g. Mix and master track 3" className="input-field" required/>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Description</label>
            <textarea value={taskForm.description} onChange={e=>setTaskForm(p=>({...p,description:e.target.value}))}
              rows={2} className="input-field resize-none" placeholder="Task details…"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Priority</label>
              <select value={taskForm.priority} onChange={e=>setTaskForm(p=>({...p,priority:e.target.value}))} className="input-field">
                {["low","medium","high","critical"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Category</label>
              <select value={taskForm.category} onChange={e=>setTaskForm(p=>({...p,category:e.target.value}))} className="input-field">
                {["design","development","audio","video","writing","research","review","other"].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Due Date</label>
              <input type="date" value={taskForm.dueDate} onChange={e=>setTaskForm(p=>({...p,dueDate:e.target.value}))}
                min={new Date().toISOString().split("T")[0]} className="input-field"/>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={()=>setShowAddTask(false)} className="btn-secondary flex-1 py-2.5 rounded-xl">Cancel</button>
            <button type="submit" className="btn-primary flex-1 py-2.5 rounded-xl">Add Task</button>
          </div>
        </form>
      </Modal>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        project={project}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={t => { setTasks(p=>p.map(x=>x._id===t._id?t:x)); setSelectedTask(null); }}
      />

      {/* File Upload Modal */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Files" size="md">
        <FileUpload
          projectId={id}
          onFileUploaded={(f) => {
            setProject(p => ({ ...p, files: [...(p.files||[]), f] }));
          }}
          onClose={() => setShowUpload(false)}
        />
      </Modal>

      {/* AI Brief Modal */}
      <Modal isOpen={showAIBrief} onClose={()=>setShowAIBrief(false)} title="✨ AI Creative Brief" size="lg">
        {brief && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-600/10 border border-brand-500/20">
              <h4 className="text-sm font-semibold text-brand-300 mb-2">Project Scope</h4>
              <p className="text-sm text-gray-300">{brief.scope}</p>
            </div>
            {brief.deliverables?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Deliverables</h4>
                <ul className="space-y-1">
                  {brief.deliverables.map((d,i)=>(
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-brand-400 mt-0.5">▸</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {brief.productionSteps?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Production Steps</h4>
                <ol className="space-y-1">
                  {brief.productionSteps.map((s,i)=>(
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-muse-cyan text-xs mt-0.5 font-mono w-4 flex-shrink-0">{i+1}.</span>{s}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {brief.estimatedTimeline && (
                <div className="p-3 bg-dark-700/60 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Timeline</p>
                  <p className="text-sm text-white">{brief.estimatedTimeline}</p>
                </div>
              )}
              {brief.suggestedTeam && (
                <div className="p-3 bg-dark-700/60 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Suggested Team</p>
                  <p className="text-sm text-white">{brief.suggestedTeam}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
