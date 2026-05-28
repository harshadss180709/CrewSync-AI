import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, File, Image, Music, Video, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const FILE_ICON = (type = "") => {
  if (type.startsWith("image")) return { Icon: Image,  color: "text-cyan-400"  };
  if (type.startsWith("audio")) return { Icon: Music,  color: "text-brand-400" };
  if (type.startsWith("video")) return { Icon: Video,  color: "text-muse-pink" };
  return { Icon: File, color: "text-gray-400" };
};

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function FileUpload({ projectId, onFileUploaded, onClose }) {
  const [dragOver, setDragOver]   = useState(false);
  const [files,    setFiles]      = useState([]); // [{ file, status, progress, url, error }]
  const inputRef = useRef(null);

  const processFiles = (fileList) => {
    const newFiles = Array.from(fileList).map(f => ({
      id:       Math.random().toString(36).slice(2),
      file:     f,
      status:   "pending",   // pending | uploading | done | error
      progress: 0,
      url:      null,
      error:    null,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver  = (e) => { e.preventDefault(); setDragOver(true);  };
  const handleDragLeave = ()    => setDragOver(false);
  const handleInputChange = (e) => processFiles(e.target.files);

  const uploadFile = async (item) => {
    setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: "uploading", progress: 10 } : f));
    try {
      const formData = new FormData();
      formData.append("file", item.file);

      const { data } = await api.post(`/projects/${projectId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / e.total) * 90) + 5;
          setFiles(prev => prev.map(f => f.id === item.id ? { ...f, progress: pct } : f));
        },
      });

      const uploaded = data.file || data.files?.[data.files.length - 1];
      setFiles(prev => prev.map(f =>
        f.id === item.id ? { ...f, status: "done", progress: 100, url: uploaded?.url } : f
      ));
      onFileUploaded?.(uploaded);
      toast.success(`${item.file.name} uploaded`);
    } catch (err) {
      const msg = err?.response?.data?.message || "Upload failed";
      setFiles(prev => prev.map(f =>
        f.id === item.id ? { ...f, status: "error", error: msg } : f
      ));
    }
  };

  const uploadAll = () => {
    files.filter(f => f.status === "pending").forEach(uploadFile);
  };

  const remove = (id) => setFiles(prev => prev.filter(f => f.id !== id));
  const pendingCount = files.filter(f => f.status === "pending").length;
  const doneCount    = files.filter(f => f.status === "done").length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
          ${dragOver
            ? "border-brand-500 bg-brand-500/10"
            : "border-white/15 hover:border-brand-500/40 hover:bg-white/3"
          }`}
      >
        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleInputChange} />
        <motion.div animate={{ scale: dragOver ? 1.05 : 1 }}>
          <Upload size={28} className={`mx-auto mb-3 ${dragOver ? "text-brand-400" : "text-gray-500"}`} />
          <p className="text-sm font-semibold text-white">
            {dragOver ? "Drop files here" : "Drag & drop files, or click to browse"}
          </p>
          <p className="text-xs text-gray-500 mt-1">Images, audio, video, documents — up to 10MB each</p>
        </motion.div>
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.map(item => {
          const { Icon, color } = FILE_ICON(item.file.type);
          return (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-3 bg-dark-700/60 border border-white/8 rounded-xl">
              <Icon size={20} className={`flex-shrink-0 ${color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.file.name}</p>
                <p className="text-xs text-gray-500">{formatBytes(item.file.size)}</p>
                {item.status === "uploading" && (
                  <div className="h-1 bg-dark-600 rounded-full mt-1.5 overflow-hidden">
                    <motion.div className="h-full bg-brand-500 rounded-full"
                      animate={{ width: `${item.progress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                )}
                {item.status === "error" && (
                  <p className="text-xs text-red-400 mt-0.5">{item.error}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                {item.status === "done"      && <CheckCircle2 size={16} className="text-green-400" />}
                {item.status === "error"     && <AlertCircle  size={16} className="text-red-400" />}
                {item.status === "uploading" && (
                  <motion.div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />
                )}
                {(item.status === "pending" || item.status === "error") && (
                  <button onClick={() => remove(item.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                    <X size={15} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 py-2.5 rounded-xl text-sm">
            Cancel
          </button>
          {pendingCount > 0 && (
            <button onClick={uploadAll} className="btn-primary flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
              <Upload size={14} />
              Upload {pendingCount} file{pendingCount !== 1 ? "s" : ""}
            </button>
          )}
          {pendingCount === 0 && doneCount > 0 && (
            <button onClick={onClose} className="btn-primary flex-1 py-2.5 rounded-xl text-sm">
              Done
            </button>
          )}
        </div>
      )}
    </div>
  );
}
