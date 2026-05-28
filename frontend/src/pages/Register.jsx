import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, User, Mail, Lock, Eye, EyeOff, Briefcase, Mic, Palette, Code } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

const ROLES = [
  { id:"client",     label:"Client",     desc:"Post projects & hire creatives",      icon: Briefcase },
  { id:"freelancer", label:"Freelancer", desc:"Find work & collaborate on projects",  icon: Mic       },
];

const SKILLS = ["Music Production","Video Editing","Graphic Design","Motion Graphics","Photography",
  "Podcast Editing","Songwriting","3D Animation","Web Development","Copywriting","Sound Design","UX Design"];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name:"", email:"", password:"", role:"freelancer", skills:[], confirmPassword:"",
  });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill) =>
    setForm(p=>({ ...p, skills: p.skills.includes(skill) ? p.skills.filter(s=>s!==skill) : [...p.skills, skill] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error("Passwords don't match.");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await register({ name:form.name, email:form.email, password:form.password, role:form.role, skills:form.skills });
      toast.success("Account created! Welcome to CrewSync 🎉");
      navigate("/dashboard");
    } catch (err) { toast.error(err?.message || "Registration failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-muse-violet/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-muse-cyan/10 rounded-full blur-[100px]" />
      </div>

      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
        className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-muse-pink rounded-xl flex items-center justify-center shadow-glow-sm">
              <Users size={20} className="text-white"/>
            </div>
            <span className="text-2xl font-black text-white">Crew<span className="text-gradient">Sync</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join 2,400+ creative professionals</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 px-1">
          {[1,2].map(s=>(
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${step >= s ? "bg-brand-600 text-white" : "bg-dark-600 text-gray-500"}`}>{s}</div>
              {s < 2 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step > s ? "bg-brand-600" : "bg-dark-600"}`}/>}
            </div>
          ))}
        </div>

        <div className="card p-7 border-white/10">
          <form onSubmit={step === 1 ? (e)=>{ e.preventDefault(); setStep(2); } : handleSubmit}>

            {step === 1 && (
              <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="space-y-4">
                {/* Role selection */}
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-2 block">I want to join as</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(r=>(
                      <button key={r.id} type="button" onClick={()=>setForm(p=>({...p,role:r.id}))}
                        className={`p-3 rounded-xl border text-left transition-all
                          ${form.role===r.id ? "border-brand-500/60 bg-brand-600/10 text-white" : "border-white/8 text-gray-400 hover:border-white/20"}`}>
                        <r.icon size={18} className={form.role===r.id ? "text-brand-400 mb-1.5" : "text-gray-500 mb-1.5"} />
                        <p className="text-xs font-semibold">{r.label}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                      placeholder="Your full name" className="input-field pl-10" required />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}
                      placeholder="you@creative.com" className="input-field pl-10" required />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type={show ? "text" : "password"} value={form.password}
                      onChange={e=>setForm(p=>({...p,password:e.target.value}))}
                      placeholder="Min. 6 characters" className="input-field pl-10 pr-10" required />
                    <button type="button" onClick={()=>setShow(p=>!p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="password" value={form.confirmPassword}
                      onChange={e=>setForm(p=>({...p,confirmPassword:e.target.value}))}
                      placeholder="Repeat password" className="input-field pl-10" required />
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full py-3 rounded-xl mt-1">
                  Continue →
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-2 block">
                    {form.role === "freelancer" ? "Select your skills (optional)" : "What kind of work do you need?"}
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar">
                    {SKILLS.map(skill=>(
                      <button key={skill} type="button" onClick={()=>toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                          ${form.skills.includes(skill)
                            ? "bg-brand-600/20 border-brand-500/50 text-brand-300"
                            : "bg-dark-700/60 border-white/8 text-gray-400 hover:border-white/20"}`}>
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={()=>setStep(1)} className="btn-secondary flex-1 py-3 rounded-xl">
                    ← Back
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 rounded-xl flex items-center justify-center gap-2">
                    {loading
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      : "Create Account 🎉"
                    }
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in →</Link>
        </p>
        <p className="text-center text-xs text-gray-700 mt-2">
          By creating an account, you agree to our Terms & Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
