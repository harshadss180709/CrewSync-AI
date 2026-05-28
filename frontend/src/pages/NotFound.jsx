import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Music2, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-brand-600/10 rounded-full blur-[100px]" />
      </div>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
        className="relative text-center max-w-md">
        {/* Animated 404 */}
        <motion.div
          animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-[120px] font-black leading-none mb-4"
        >
          <span className="text-gradient">404</span>
        </motion.div>

        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-brand-500 to-muse-pink rounded-2xl flex items-center justify-center shadow-glow-md">
          <Music2 size={28} className="text-white" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Track Not Found</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Looks like this page dropped out of the playlist. Let's get you back to the mix.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard" className="btn-primary flex items-center justify-center gap-2">
            <Home size={16} /> Back to Dashboard
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
