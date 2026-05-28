import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star, MapPin, DollarSign, Shield, Zap } from "lucide-react";

export default function FreelancerCard({ freelancer, index = 0, onInvite, compatibilityScore }) {
  const stars = Math.round(freelancer.averageRating || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="card-hover p-5 group"
    >
      {/* AI score badge */}
      {compatibilityScore && (
        <div className="flex items-center gap-1.5 mb-3 badge-purple self-start">
          <Zap size={11} className="text-brand-400" />
          <span>{compatibilityScore}% AI Match</span>
        </div>
      )}

      {/* Profile */}
      <div className="flex items-start gap-3 mb-4">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-muse-pink flex items-center justify-center overflow-hidden ring-2 ring-brand-500/20">
            {freelancer.avatar
              ? <img src={freelancer.avatar} alt={freelancer.name} className="w-full h-full object-cover" />
              : <span className="text-lg font-bold text-white">{freelancer.name?.[0]}</span>
            }
          </div>
          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-dark-800
            ${freelancer.availability === "available" ? "bg-green-400" :
              freelancer.availability === "busy"      ? "bg-yellow-400" : "bg-gray-500"}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${freelancer._id}`}
            className="font-semibold text-white hover:text-brand-400 transition-colors block truncate">
            {freelancer.name}
          </Link>
          <p className="text-xs text-gray-500 truncate">{freelancer.bio?.slice(0,60) || "Creative freelancer"}</p>
          {freelancer.location && (
            <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
              <MapPin size={10} /><span>{freelancer.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Rating & rate */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {Array.from({length:5}).map((_,i) => (
            <Star key={i} size={12} fill={i < stars ? "#f59e0b" : "none"} className={i < stars ? "text-yellow-400" : "text-gray-600"} />
          ))}
          <span className="text-xs text-gray-400 ml-1">
            {freelancer.averageRating?.toFixed(1) || "New"} ({freelancer.totalReviews || 0})
          </span>
        </div>
        {freelancer.hourlyRate > 0 && (
          <div className="flex items-center gap-1 text-xs text-green-400 font-semibold">
            <DollarSign size={11} />
            <span>{freelancer.hourlyRate}/hr</span>
          </div>
        )}
      </div>

      {/* Reliability */}
      <div className="flex items-center gap-2 mb-3">
        <Shield size={12} className="text-brand-400" />
        <div className="flex-1 h-1 bg-dark-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-green-400 rounded-full"
            style={{ width: `${freelancer.reliabilityScore || 0}%` }}
          />
        </div>
        <span className="text-xs text-gray-400">{freelancer.reliabilityScore || 0}%</span>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {freelancer.skills?.slice(0, 4).map(skill => (
          <span key={skill} className="badge-purple text-[10px] px-2 py-0.5">{skill}</span>
        ))}
        {freelancer.skills?.length > 4 && (
          <span className="text-[10px] text-gray-500">+{freelancer.skills.length - 4}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link to={`/profile/${freelancer._id}`}
          className="flex-1 btn-secondary text-center text-xs py-2 rounded-lg">
          View Profile
        </Link>
        {onInvite && (
          <button onClick={() => onInvite(freelancer)}
            className="flex-1 btn-primary text-xs py-2 rounded-lg">
            Invite
          </button>
        )}
      </div>
    </motion.div>
  );
}
