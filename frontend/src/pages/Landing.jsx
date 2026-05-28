import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Music2, Zap, Shield, BarChart3, Users, DollarSign,
  ArrowRight, Star, CheckCircle, Play, Globe, Cpu,
  GitBranch, Layers, ChevronRight, Sparkles, MessageSquare,
  Kanban, FileUp, Lock, Unlock, TrendingUp, Brain, ChevronDown, Plus
} from "lucide-react";

/* ── Reusable fade-in section ──────────────────────────── */
function FadeSection({ children, className = "", delay = 0 }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}>
      {children}
    </motion.div>
  );
}

/* ── Data ─────────────────────────────────────────────── */
const features = [
  { icon: Cpu,       title: "AI Project Allocation",    desc: "Gemini AI analyses skills, ratings and availability to recommend your perfect team.", color: "from-brand-600/30 to-muse-violet/20", border: "border-brand-500/20" },
  { icon: DollarSign,title: "Smart Payment Splitting",  desc: "Contribution scores auto-calculate fair revenue splits. Escrow protects every payment.", color: "from-muse-cyan/20 to-blue-600/10",   border: "border-cyan-500/20"   },
  { icon: Zap,       title: "Realtime Collaboration",   desc: "Socket.IO-powered chat, typing indicators, file sharing and live task boards.", color: "from-yellow-500/20 to-orange-500/10",border: "border-yellow-500/20" },
  { icon: BarChart3, title: "Creative Analytics",       desc: "Delay-risk scoring, performance trends, contribution heatmaps and earnings history.", color: "from-green-500/20 to-emerald-500/10",border: "border-green-500/20"  },
  { icon: Users,     title: "Freelancer Discovery",     desc: "Filter by skills, ratings, availability and hourly rate. AI-ranked results for your brief.", color: "from-muse-pink/20 to-rose-600/10",  border: "border-pink-500/20"   },
  { icon: Shield,    title: "Reputation & Portfolio",   desc: "Detailed profiles with reviews, contribution history, reliability scores and showcase work.", color: "from-purple-500/20 to-violet-600/10",border: "border-purple-500/20" },
];

const testimonials = [
  { name:"Arjun Mehta",   role:"Music Producer",      avatar:"A", text:"CrewSync's AI matched me with the perfect video editor for my EP launch. The split payment system is genius — no more awkward money conversations.", rating:5 },
  { name:"Sara Chen",     role:"Motion Designer",     avatar:"S", text:"I've tripled my project income since joining. The contribution tracking is completely transparent — clients can see exactly what I'm delivering.", rating:5 },
  { name:"Marcus O'Brien",role:"Film Director",       avatar:"M", text:"Managing 6 freelancers on a single campaign was chaos before CrewSync. Now everything is one dashboard — tasks, chat, payments, all live.", rating:5 },
];

const pricing = [
  {
    name: "Creator", price: 0, period: "Free forever",
    features: ["Up to 2 active projects","Basic AI matching","5 GB file storage","Community chat"],
    cta: "Get Started Free", highlight: false,
  },
  {
    name: "Pro",     price: 29, period: "/month",
    features: ["Unlimited projects","Advanced AI allocation","100 GB storage","Smart payment splitting","Priority support","Analytics dashboard"],
    cta: "Start 14-day Trial", highlight: true,
  },
  {
    name: "Studio",  price: 99, period: "/month",
    features: ["Everything in Pro","White-label workspace","Custom payment workflows","API access","Dedicated account manager","SLA guarantee"],
    cta: "Contact Sales", highlight: false,
  },
];

/* ── Demo Modal ───────────────────────────────────────── */
function DemoModal({ onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl glass border border-white/10 rounded-2xl overflow-hidden shadow-glass"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <span className="text-white font-semibold">CrewSync AI — Demo</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>
        <div className="aspect-video bg-dark-900 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
            <Play size={28} className="text-brand-400 ml-1" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg">Demo Coming Soon</p>
            <p className="text-gray-500 text-sm mt-1">We're working on a walkthrough video.</p>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-white/8 flex justify-end">
          <Link to="/register" onClick={onClose} className="btn-primary text-sm">Get Early Access →</Link>
        </div>
      </motion.div>
    </div>
  );
}

/* ── FAQ Section ──────────────────────────────────────── */
const FAQ_ITEMS = [
  { q: "How does escrow work?", a: "When a client creates a project, they fund an escrow wallet on CrewSync. Funds are locked until milestones are marked complete and approved. Once approved, payments are automatically released to freelancers based on their contribution scores — no manual transfers needed." },
  { q: "How does AI match freelancers?", a: "Our Gemini AI engine scores every freelancer against your project brief, taking into account skills, portfolio quality, availability, past ratings, and response time. You get a ranked shortlist of candidates best suited for your specific project." },
  { q: "What's the platform commission?", a: "CrewSync charges a flat 8% platform fee on successful payments. There are no listing fees, no subscription required for freelancers, and no hidden charges. Clients on the Pro plan get reduced fees of 5%." },
  { q: "Can I work with my existing team?", a: "Absolutely. You can invite specific freelancers to your project directly by email or username. AI matching is optional — it's there when you need to find new talent, but never required." },
  { q: "How is contribution calculated?", a: "The AI tracks task completions, file uploads, message activity, and milestone delivery for each team member. A weighted score is computed and used to determine each person's share of the project payment automatically." },
  { q: "Is my data secure?", a: "All data is encrypted in transit (TLS 1.3) and at rest. Files are stored on Cloudinary with private access controls. Payment information is handled by Stripe and never stored on CrewSync servers." },
  { q: "What file types are supported?", a: "CrewSync supports all common file types: images (PNG, JPG, PSD, AI), audio (WAV, MP3, FLAC), video (MP4, MOV), documents (PDF, DOCX), and archives (ZIP). Individual file size limit is 100MB on Pro plans." },
  { q: "Can I try before I pay?", a: "Yes. The Creator plan is completely free with up to 2 active projects. No credit card required. You can upgrade to Pro at any time when you need unlimited projects and advanced features." },
];

function FAQSection() {
  const [open, setOpen] = useState(null);
  return (
    <section className="py-24 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <FadeSection className="text-center mb-14">
          <span className="badge-purple mb-4 inline-block">FAQ</span>
          <h2 className="text-4xl font-black text-white mb-3">
            Got <span className="text-gradient">questions?</span>
          </h2>
          <p className="text-gray-400">Everything you need to know about CrewSync AI.</p>
        </FadeSection>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <FadeSection key={i} delay={i * 0.04}>
              <div className={`card overflow-hidden transition-all ${open === i ? "border-brand-500/30" : "hover:border-white/15"}`}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left gap-4"
                >
                  <span className="text-sm font-semibold text-white">{item.q}</span>
                  <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Component ────────────────────────────────────────── */
export default function Landing() {
  const [showDemo, setShowDemo] = useState(false);
  return (
    <div className="min-h-screen bg-dark-950 overflow-x-hidden">

      {/* ── Navbar ───────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-16 glass border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-muse-pink rounded-lg flex items-center justify-center">
              <Users size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white">
              Crew<span className="text-gradient">Sync</span> <span className="text-xs font-normal text-brand-400 ml-0.5">AI</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {["Features","Pricing","About"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-sm text-gray-400 hover:text-white transition-colors font-medium">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"    className="btn-ghost text-sm">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started →</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-4 md:px-6 overflow-hidden">
        {/* Ambient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ scale:[1,1.1,1], opacity:[0.3,0.5,0.3] }} transition={{ duration:8,repeat:Infinity }}
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-600/20 rounded-full blur-[120px]" />
          <motion.div animate={{ scale:[1,1.15,1], opacity:[0.2,0.35,0.2] }} transition={{ duration:10,repeat:Infinity,delay:2 }}
            className="absolute top-40 -right-40 w-96 h-96 bg-muse-pink/15 rounded-full blur-[100px]" />
          <motion.div animate={{ scale:[1,1.08,1], opacity:[0.15,0.3,0.15] }} transition={{ duration:12,repeat:Infinity,delay:4 }}
            className="absolute bottom-0 -left-40 w-96 h-96 bg-muse-cyan/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
            className="inline-flex items-center gap-2 badge-purple px-4 py-2 mb-8 text-sm">
            <Sparkles size={14} className="text-brand-400 animate-pulse" />
            Powered by Gemini AI · Socket.IO Realtime · Smart Escrow
          </motion.div>

          <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.1 }}
            className="text-5xl md:text-7xl font-black leading-[1.05] mb-6">
            <span className="text-white">Where Creative</span>
            <br />
            <span className="text-gradient">Teams Get Paid</span>
            <br />
            <span className="text-white">What They Deserve</span>
          </motion.h1>

          <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered freelancer allocation, realtime collaboration, and
            <span className="text-brand-400 font-semibold"> contribution-based smart payments</span> — all in one cinematic workspace.
          </motion.p>

          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link to="/register"
              className="group flex items-center gap-2 bg-gradient-to-r from-brand-600 to-muse-violet hover:from-brand-500 hover:to-muse-purple
                text-white font-semibold px-7 py-3.5 rounded-2xl transition-all duration-300 shadow-glow-md hover:shadow-glow-lg">
              Start Building for Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button onClick={() => setShowDemo(true)}
              className="flex items-center gap-2 btn-secondary px-6 py-3.5 rounded-2xl">
              <Play size={16} className="text-brand-400" />
              Watch Demo
            </button>
          </motion.div>

        </div>

        {/* Hero dashboard mock */}
        <motion.div initial={{ opacity:0, y:60 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.4 }}
          className="relative max-w-5xl mx-auto mt-16">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-glass bg-dark-800/80 backdrop-blur-xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-dark-900/50">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="text-xs text-gray-500 ml-2 font-mono">crewsync.ai — dashboard</span>
            </div>
            <div className="p-6 grid grid-cols-4 gap-4">
              {[
                { l:"Active Projects", v:"12",  c:"text-brand-400", bg:"from-brand-600/20 to-brand-900/20" },
                { l:"Total Earnings",  v:"$8.4k",c:"text-green-400", bg:"from-green-600/20 to-green-900/20" },
                { l:"Team Members",    v:"28",  c:"text-cyan-400",  bg:"from-cyan-600/20 to-cyan-900/20"   },
                { l:"AI Score",        v:"94%", c:"text-muse-pink", bg:"from-pink-600/20 to-pink-900/20"   },
              ].map((s,i)=>(
                <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6+i*0.1 }}
                  className={`rounded-xl p-4 bg-gradient-to-br ${s.bg} border border-white/8`}>
                  <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.l}</div>
                </motion.div>
              ))}
            </div>
            <div className="px-6 pb-6 grid grid-cols-3 gap-3">
              {["🎵 EP Campaign","🎬 Brand Film","🎨 Album Art"].map((p,i)=>(
                <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.9+i*0.1 }}
                  className="bg-dark-700/60 rounded-xl p-3 border border-white/8">
                  <p className="text-xs font-medium text-white">{p}</p>
                  <div className="mt-2 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-muse-violet rounded-full"
                      style={{ width: `${[75,42,88][i]}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">{[75,42,88][i]}% complete</p>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Reflection */}
          <div className="absolute inset-x-8 -bottom-8 h-24 bg-brand-600/10 blur-2xl rounded-full" />
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section id="features" className="py-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <FadeSection className="text-center mb-16">
            <span className="badge-purple mb-4 inline-block">Platform Features</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Everything your <span className="text-gradient">creative team</span> needs
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              From AI-matched talent to automated payroll — CrewSync handles the business so you can focus on the art.
            </p>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FadeSection key={i} delay={i * 0.08}>
                <div className={`h-full p-6 rounded-2xl bg-gradient-to-br ${f.color} border ${f.border} hover:scale-[1.02] transition-transform duration-300 group`}>
                  <div className="w-11 h-11 bg-dark-700/60 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <f.icon size={22} className="text-brand-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section id="about" className="py-24 px-4 md:px-6 bg-dark-900/40">
        <div className="max-w-5xl mx-auto">
          <FadeSection className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">
              Up and running in <span className="text-gradient">3 steps</span>
            </h2>
          </FadeSection>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step:"01", title:"Describe Your Project", desc:"Enter your creative brief. Our AI instantly generates scope, timeline, deliverables and budget estimates.", icon: Layers },
              { step:"02", title:"AI Matches Your Team",  desc:"Gemini AI scores every available freelancer for compatibility, reliability and skill fit.", icon: Cpu },
              { step:"03", title:"Collaborate & Get Paid",desc:"Realtime workspace with smart escrow. Payments auto-split based on contribution scores.", icon: DollarSign },
            ].map((s,i) => (
              <FadeSection key={i} delay={i*0.15}>
                <div className="relative text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-brand-600/30 to-muse-violet/20 border border-brand-500/30 rounded-2xl flex items-center justify-center">
                    <s.icon size={24} className="text-brand-400" />
                  </div>
                  <span className="text-5xl font-black text-brand-500/20 absolute -top-3 left-1/2 -translate-x-1/2 z-0 select-none">{s.step}</span>
                  <h3 className="text-lg font-semibold text-white mb-2 relative z-10">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                  {i < 2 && <ChevronRight size={20} className="text-brand-500/30 absolute -right-4 top-1/3 hidden md:block" />}
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Workflow Showcase ─────────────────────── */}
      <section className="py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <FadeSection className="text-center mb-16">
            <span className="badge-purple mb-4 inline-block">AI-Powered Workflow</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              From idea to <span className="text-gradient">payment</span> in 6 steps
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              CrewSync AI handles every stage of your project lifecycle automatically.
            </p>
          </FadeSection>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Layers,      label: "Create Project",    desc: "Define scope & budget",    color: "from-brand-600/30", step: "01" },
              { icon: Brain,       label: "AI Analyses",       desc: "Skills, timeline, risks",  color: "from-purple-600/30", step: "02" },
              { icon: Users,       label: "Team Matched",      desc: "Best-fit freelancers",     color: "from-muse-violet/30", step: "03" },
              { icon: Kanban,      label: "Work Begins",       desc: "Live tasks & chat",        color: "from-cyan-600/30", step: "04" },
              { icon: TrendingUp,  label: "AI Monitors",       desc: "Progress & bottlenecks",   color: "from-green-600/30", step: "05" },
              { icon: DollarSign,  label: "Pay Fairly",        desc: "Auto split by contribution",color: "from-yellow-600/30", step: "06" },
            ].map((s, i) => (
              <FadeSection key={i} delay={i * 0.1}>
                <div className={`relative card p-4 text-center hover:scale-105 transition-transform bg-gradient-to-b ${s.color} to-dark-800/40`}>
                  <span className="text-3xl font-black text-white/5 absolute top-1 left-2 select-none">{s.step}</span>
                  <div className="w-10 h-10 mx-auto mb-3 bg-dark-700/60 rounded-xl flex items-center justify-center">
                    <s.icon size={18} className="text-brand-400" />
                  </div>
                  <p className="text-xs font-semibold text-white mb-1">{s.label}</p>
                  <p className="text-[10px] text-gray-500">{s.desc}</p>
                  {i < 5 && <ChevronRight size={14} className="text-brand-500/30 absolute -right-2 top-1/2 -translate-y-1/2 hidden lg:block z-10" />}
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Collaboration Features ────────────────────── */}
      <section className="py-24 px-4 md:px-6 bg-dark-900/40">
        <div className="max-w-6xl mx-auto">
          <FadeSection className="text-center mb-16">
            <span className="badge-purple mb-4 inline-block">Collaboration Suite</span>
            <h2 className="text-4xl font-black text-white mb-4">
              Every tool your team <span className="text-gradient">actually needs</span>
            </h2>
          </FadeSection>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare, title: "Realtime Chat",
                color: "from-brand-600/20", border: "border-brand-500/20",
                desc: "Socket.IO-powered messaging with typing indicators, file sharing, and message history. Your entire team, always in sync.",
                mock: (
                  <div className="space-y-2 mt-4">
                    {[["A","Finalised the mix ✅","brand-400"],["S","Uploading final stems now","gray-400"],["M","Payment released 🎉","green-400"]].map(([av,msg,c],i)=>(
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full bg-${c}/20 flex items-center justify-center text-[9px] font-bold text-${c} flex-shrink-0`}>{av}</div>
                        <div className="bg-dark-700/50 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-400">{msg}</div>
                      </div>
                    ))}
                  </div>
                )
              },
              {
                icon: Kanban, title: "Visual Task Board",
                color: "from-muse-violet/20", border: "border-purple-500/20",
                desc: "Drag-and-drop Kanban with priority labels, due dates, assignees, and real-time updates pushed to every team member.",
                mock: (
                  <div className="grid grid-cols-3 gap-1.5 mt-4">
                    {[["To Do","gray-500",[("Mix vocals"),("Master")]],["In Progress","yellow-400",[("Edit video")]],["Done","green-400",[("Artwork"),("Script")]]].map(([label,c,items],i)=>(
                      <div key={i} className="space-y-1">
                        <div className={`text-[9px] font-semibold text-${c} mb-1`}>{label}</div>
                        {items.map((t,j)=><div key={j} className="bg-dark-700/60 rounded px-1.5 py-1 text-[9px] text-gray-400 border border-white/5">{t}</div>)}
                      </div>
                    ))}
                  </div>
                )
              },
              {
                icon: FileUp, title: "File Sharing",
                color: "from-cyan-600/20", border: "border-cyan-500/20",
                desc: "Drag-and-drop uploads via Cloudinary. Images, audio stems, video cuts — organised per project and always accessible.",
                mock: (
                  <div className="space-y-1.5 mt-4">
                    {[["🎵","final_mix_v3.wav","4.2 MB"],["🖼️","album_artwork.png","1.1 MB"],["🎬","promo_cut.mp4","18 MB"]].map(([ic,name,size],i)=>(
                      <div key={i} className="flex items-center gap-2 bg-dark-700/40 rounded-lg px-2.5 py-1.5">
                        <span className="text-sm">{ic}</span>
                        <span className="text-[10px] text-gray-300 flex-1 truncate">{name}</span>
                        <span className="text-[9px] text-gray-600">{size}</span>
                      </div>
                    ))}
                  </div>
                )
              },
            ].map((f, i) => (
              <FadeSection key={i} delay={i * 0.12}>
                <div className={`card p-6 h-full bg-gradient-to-br ${f.color} to-dark-800/40 border ${f.border} hover:scale-[1.02] transition-transform`}>
                  <div className="w-10 h-10 bg-dark-700/60 rounded-xl flex items-center justify-center mb-3">
                    <f.icon size={20} className="text-brand-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                  {f.mock}
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Payment & Escrow ─────────────────────────── */}
      <section className="py-24 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <FadeSection className="text-center mb-16">
            <span className="badge-purple mb-4 inline-block">Smart Payments</span>
            <h2 className="text-4xl font-black text-white mb-4">
              Your money is <span className="text-gradient">always protected</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Our escrow system holds funds securely until milestones are complete — then splits payment by contribution score.
            </p>
          </FadeSection>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-brand-500/30 via-brand-500 to-brand-500/30" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Plus,     label: "Fund Escrow",      desc: "Client deposits budget into secure escrow", color: "text-cyan-400",   bg: "bg-cyan-500/15",  border: "border-cyan-500/30"  },
                { icon: Lock,     label: "Funds Held",       desc: "Money locked until milestone completion",    color: "text-yellow-400", bg: "bg-yellow-500/15",border: "border-yellow-500/30"},
                { icon: CheckCircle,label:"Work Completed",  desc: "Freelancers deliver, client reviews quality",color: "text-green-400",  bg: "bg-green-500/15", border: "border-green-500/30" },
                { icon: Unlock,   label: "Auto Split & Pay", desc: "AI calculates fair splits, funds released",   color: "text-brand-400",  bg: "bg-brand-500/15", border: "border-brand-500/30" },
              ].map((s, i) => (
                <FadeSection key={i} delay={i * 0.12}>
                  <div className="text-center relative z-10">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${s.bg} border ${s.border} flex items-center justify-center`}>
                      <s.icon size={24} className={s.color} />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">{s.label}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </FadeSection>
              ))}
            </div>
          </div>

          <FadeSection delay={0.4}>
            <div className="mt-12 card p-6 bg-gradient-to-r from-brand-600/10 to-muse-violet/10 border border-brand-500/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield size={18} className="text-brand-400" />
                <span className="text-white font-semibold">Zero Payment Disputes</span>
              </div>
              <p className="text-sm text-gray-400 max-w-lg mx-auto">
                AI contribution scoring means every team member gets paid exactly what they've earned — automatically, transparently, and without conflict.
              </p>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── Analytics Showcase ───────────────────────── */}
      <section className="py-24 px-4 md:px-6 bg-dark-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <FadeSection>
              <span className="badge-purple mb-4 inline-block">Analytics</span>
              <h2 className="text-4xl font-black text-white mb-4">
                Data that <span className="text-gradient">drives decisions</span>
              </h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Track earnings, delivery velocity, and team performance at a glance. AI-powered delay-risk scoring keeps every project on track.
              </p>
              <ul className="space-y-3">
                {["Earnings trend (6-month history)", "Per-freelancer contribution heatmaps", "AI delay-risk scoring (0–100)", "Budget vs. actual spend tracking", "Task velocity & completion rates"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <CheckCircle size={15} className="text-brand-400 flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </FadeSection>

            <FadeSection delay={0.2}>
              <div className="card p-5 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">Project Health</span>
                  <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">On Track</span>
                </div>
                {[["Task Completion","78","brand"],["Milestone Progress","60","purple"],["Budget Used","45","green"],["Time Elapsed","55","yellow"]].map(([label,val,c],i)=>(
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">{label}</span>
                      <span className={`text-${c}-400`}>{val}%</span>
                    </div>
                    <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                      <motion.div className={`h-full bg-${c}-500 rounded-full`}
                        initial={{ width: 0 }} whileInView={{ width: `${val}%` }}
                        viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.15 }} />
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[["12","Tasks Done","green"],["3","In Review","yellow"],["5","Remaining","gray"]].map(([v,l,c],i)=>(
                    <div key={i} className={`text-center p-2 bg-${c}-500/10 border border-${c}-500/20 rounded-xl`}>
                      <p className={`text-lg font-bold text-${c}-400`}>{v}</p>
                      <p className="text-[9px] text-gray-500">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <FAQSection />

      {/* ── Testimonials removed ─────────────────────── */}
      {false && <section className="py-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <FadeSection className="text-center mb-14">
            <h2 className="text-4xl font-black text-white mb-3">
              Loved by <span className="text-gradient">creatives</span> worldwide
            </h2>
          </FadeSection>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <FadeSection key={i} delay={i*0.1}>
                <div className="card p-6 h-full flex flex-col hover:border-brand-500/20 transition-colors">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({length:t.rating}).map((_,j)=>(
                      <Star key={j} size={14} fill="#f59e0b" className="text-yellow-400"/>
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-5">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-muse-pink flex items-center justify-center text-white font-bold text-sm">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>}

      {/* ── Pricing ──────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 md:px-6 bg-dark-900/40">
        <div className="max-w-5xl mx-auto">
          <FadeSection className="text-center mb-14">
            <h2 className="text-4xl font-black text-white mb-3">
              Simple, <span className="text-gradient">transparent</span> pricing
            </h2>
            <p className="text-gray-400">No hidden fees. Cancel anytime.</p>
          </FadeSection>

          <div className="grid md:grid-cols-3 gap-5">
            {pricing.map((plan, i) => (
              <FadeSection key={i} delay={i*0.1}>
                <div className={`relative card p-7 flex flex-col h-full transition-all duration-300 hover:scale-[1.02]
                  ${plan.highlight
                    ? "border-brand-500/50 bg-gradient-to-b from-brand-600/10 to-dark-800/50 shadow-glow-md"
                    : "hover:border-white/15"
                  }`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge-purple px-4 py-1 text-xs font-semibold whitespace-nowrap">
                      ⭐ Most Popular
                    </div>
                  )}
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black text-white">${plan.price}</span>
                      <span className="text-gray-500 text-sm mb-1">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-7">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle size={14} className="text-brand-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register"
                    className={`w-full text-center font-semibold py-3 rounded-xl transition-all duration-200 text-sm
                      ${plan.highlight
                        ? "bg-gradient-to-r from-brand-600 to-muse-violet hover:from-brand-500 hover:to-muse-purple text-white shadow-glow-sm"
                        : "btn-secondary"
                      }`}>
                    {plan.cta}
                  </Link>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="py-24 px-4 md:px-6">
        <FadeSection>
          <div className="max-w-3xl mx-auto text-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-600/20 via-muse-violet/20 to-muse-pink/20 rounded-3xl blur-2xl" />
            <div className="relative card p-12 border-brand-500/20">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                Start creating <span className="text-gradient">smarter</span> today
              </h2>
              <p className="text-gray-400 mb-8 text-lg">
                Be among the first creatives to build, collaborate, and get paid fairly with CrewSync.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register"
                  className="group flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-muse-violet text-white font-semibold px-8 py-4 rounded-2xl hover:shadow-glow-lg transition-all">
                  Create Free Account
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <p className="text-xs text-gray-600 mt-4">No credit card required · Free plan available</p>
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-white/8 py-10 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-muse-pink rounded-lg flex items-center justify-center">
              <Music2 size={14} className="text-white"/>
            </div>
            <span className="font-bold text-white">CrewSync AI</span>
          </div>
          <p className="text-sm text-gray-600">© 2025 CrewSync AI. Built for creative professionals worldwide.</p>
          <div className="flex gap-4 text-sm text-gray-600">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}
    </div>
  );
}
