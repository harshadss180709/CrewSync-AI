import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Globe, Star, Shield, DollarSign, Briefcase, Edit3, Plus, X, Loader, ExternalLink } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import Modal from "../components/common/Modal.jsx";
import { PageLoader } from "../components/common/LoadingSkeleton.jsx";
import toast from "react-hot-toast";

export default function Profile() {
  const { id }          = useParams();
  const { user, updateUser, isRole } = useAuth();
  const profileId       = id || user?._id;
  const isOwnProfile    = profileId === user?._id;

  const [profile,     setProfile]     = useState(null);
  const [reviews,     setReviews]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showEdit,    setShowEdit]    = useState(false);
  const [editForm,    setEditForm]    = useState({});
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/users/${profileId}`);
        setProfile(data.user);
        setReviews(data.reviews || []);
        if (isOwnProfile) setEditForm({
          name: data.user.name, bio: data.user.bio, location: data.user.location,
          website: data.user.website, hourlyRate: data.user.hourlyRate,
          skills: data.user.skills?.join(", ") || "", availability: data.user.availability,
        });
      } catch { toast.error("Profile not found."); }
      finally { setLoading(false); }
    };
    load();
  }, [profileId]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...editForm, skills: editForm.skills.split(",").map(s=>s.trim()).filter(Boolean) };
      const { data } = await api.put("/users/profile", payload);
      setProfile(data.user);
      updateUser(data.user);
      setShowEdit(false);
      toast.success("Profile updated!");
    } catch { toast.error("Failed to save."); }
    finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;
  if (!profile) return <div className="card p-10 text-center text-gray-400">Profile not found.</div>;

  const availColors = { available:"text-green-400", busy:"text-yellow-400", offline:"text-gray-500" };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-muse-pink flex items-center justify-center overflow-hidden ring-4 ring-brand-500/20">
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover"/>
                : <span className="text-3xl font-black text-white">{profile.name?.[0]}</span>
              }
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-dark-800
              ${profile.availability==="available"?"bg-green-400":profile.availability==="busy"?"bg-yellow-400":"bg-gray-500"}`}/>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="badge-purple capitalize">{profile.role}</span>
                  <span className={`text-xs font-medium capitalize ${availColors[profile.availability]}`}>
                    ● {profile.availability}
                  </span>
                  {profile.isVerified && <span className="badge-green text-xs">✓ Verified</span>}
                </div>
              </div>
              {isOwnProfile && (
                <button onClick={()=>setShowEdit(true)} className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 rounded-xl">
                  <Edit3 size={13}/> Edit Profile
                </button>
              )}
            </div>

            {profile.bio && <p className="text-sm text-gray-400 mt-3 leading-relaxed max-w-xl">{profile.bio}</p>}

            <div className="flex flex-wrap gap-4 mt-3">
              {profile.location && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin size={12}/>{profile.location}
                </div>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300">
                  <Globe size={12}/>{profile.website.replace(/https?:\/\//,"")}
                </a>
              )}
              {profile.hourlyRate > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                  <DollarSign size={12}/>{profile.hourlyRate}/hr
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/8">
          {[
            { label:"Rating",      value: profile.averageRating?.toFixed(1)||"—", icon: Star, color:"text-yellow-400"  },
            { label:"Reviews",     value: profile.totalReviews||0,                icon: Briefcase, color:"text-brand-400"},
            { label:"Reliability", value: `${profile.reliabilityScore||0}%`,       icon: Shield, color:"text-cyan-400"  },
            { label:"Earned",      value: `$${profile.totalEarnings?.toLocaleString()||0}`, icon: DollarSign, color:"text-green-400" },
          ].map(s=>(
            <div key={s.label} className="text-center">
              <s.icon size={14} className={`${s.color} mx-auto mb-1`}/>
              <p className="text-base font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Skills & tags */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Skills</h2>
          {profile.skills?.length ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(s=><span key={s} className="badge-purple">{s}</span>)}
            </div>
          ) : <p className="text-xs text-gray-500">No skills listed.</p>}

          {profile.specialtyTags?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wider">Specialties</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.specialtyTags.map(t=><span key={t} className="badge-cyan text-xs">{t}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Portfolio */}
        <div className="md:col-span-2 card p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Portfolio</h2>
          {profile.portfolio?.length ? (
            <div className="grid grid-cols-2 gap-3">
              {profile.portfolio.map((item,i)=>(
                <div key={i} className="p-3 bg-dark-700/50 rounded-xl border border-white/8 hover:border-brand-500/30 transition-colors">
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                  {item.fileUrl && (
                    <a href={item.fileUrl} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 mt-1.5">
                      <ExternalLink size={10}/> View
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-gray-500">No portfolio items yet.</p>}
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Reviews ({reviews.length})</h2>
          <div className="space-y-4">
            {reviews.map((r,i)=>(
              <div key={r._id||i} className="pb-4 border-b border-white/5 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-muse-pink flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                    {r.reviewer?.name?.[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{r.reviewer?.name}</p>
                      <div className="flex gap-0.5">
                        {Array.from({length:5}).map((_,j)=>(
                          <Star key={j} size={11} fill={j<r.rating?"#f59e0b":"none"} className={j<r.rating?"text-yellow-400":"text-gray-600"}/>
                        ))}
                      </div>
                      <span className="text-xs text-gray-600">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{r.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit modal */}
      <Modal isOpen={showEdit} onClose={()=>setShowEdit(false)} title="Edit Profile" size="md">
        <form onSubmit={saveProfile} className="space-y-4">
          {[
            { key:"name",       label:"Full Name",   type:"text",   placeholder:"Your name" },
            { key:"bio",        label:"Bio",         type:"textarea",placeholder:"Tell us about yourself…" },
            { key:"location",   label:"Location",    type:"text",   placeholder:"City, Country" },
            { key:"website",    label:"Website",     type:"url",    placeholder:"https://" },
            { key:"hourlyRate", label:"Hourly Rate ($)", type:"number", placeholder:"50" },
          ].map(f=>(
            <div key={f.key}>
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">{f.label}</label>
              {f.type === "textarea"
                ? <textarea value={editForm[f.key]||""} onChange={e=>setEditForm(p=>({...p,[f.key]:e.target.value}))}
                    placeholder={f.placeholder} rows={3} className="input-field resize-none"/>
                : <input type={f.type} value={editForm[f.key]||""} onChange={e=>setEditForm(p=>({...p,[f.key]:e.target.value}))}
                    placeholder={f.placeholder} className="input-field"/>
              }
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Skills (comma separated)</label>
            <input value={editForm.skills||""} onChange={e=>setEditForm(p=>({...p,skills:e.target.value}))}
              placeholder="Music Production, Video Editing, …" className="input-field"/>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-medium mb-1.5 block">Availability</label>
            <select value={editForm.availability||"available"} onChange={e=>setEditForm(p=>({...p,availability:e.target.value}))}
              className="input-field">
              {["available","busy","offline"].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={()=>setShowEdit(false)} className="btn-secondary flex-1 py-3 rounded-xl">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 rounded-xl flex items-center justify-center gap-2">
              {saving ? <Loader size={14} className="animate-spin"/> : null}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
