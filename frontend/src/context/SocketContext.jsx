import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const socketRef   = useRef(null);
  const handlersRef = useRef(new Set()); // registered notification handlers

  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!token || !user) {
      socketRef.current?.disconnect();
      setIsConnected(false);
      return;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || "https://crewsync-ai.onrender.com", {
      auth:       { token },
      transports: ["websocket", "polling"],
      reconnection:         true,
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
    });

    socket.on("connect",    () => { setIsConnected(true);  console.log("🔌 Socket connected"); });
    socket.on("disconnect", () => { setIsConnected(false); console.log("🔌 Socket disconnected"); });

    socket.on("user:offline", ({ userId }) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== userId));
    });

    // ── Broadcast notification:new to all registered handlers ──
    socket.on("notification:new", (notification) => {
      handlersRef.current.forEach(handler => handler(notification));
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user]);

  // ── Register / unregister a notification handler ──────────
  // Components call this to receive real-time notifications.
  // Returns a cleanup function to deregister.
  const onNotification = useCallback((handler) => {
    handlersRef.current.add(handler);
    return () => handlersRef.current.delete(handler);
  }, []);

  // ── Project room helpers ──────────────────────────────────
  const joinProject      = (pid) => socketRef.current?.emit("project:join",   pid);
  const leaveProject     = (pid) => socketRef.current?.emit("project:leave",  pid);
  const sendTypingStart  = (pid) => socketRef.current?.emit("typing:start",  { projectId: pid });
  const sendTypingStop   = (pid) => socketRef.current?.emit("typing:stop",   { projectId: pid });
  const emitTaskMove     = (pid, tid, status, pos) =>
    socketRef.current?.emit("task:move", { projectId: pid, taskId: tid, newStatus: status, position: pos });

  const on  = (event, cb) => socketRef.current?.on(event,  cb);
  const off = (event, cb) => socketRef.current?.off(event, cb);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      onlineUsers,
      onNotification,
      joinProject,
      leaveProject,
      sendTypingStart,
      sendTypingStop,
      emitTaskMove,
      on,
      off,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
