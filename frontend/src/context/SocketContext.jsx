import {
  createContext, useContext,
  useEffect, useRef, useState, useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const socketRef   = useRef(null);

  // ── Notification handler registry ────────────────────────
  // Handlers are stored in a stable Set. The socket's internal
  // dispatcher accesses this Set by reference, so:
  //   • reconnects → same Set, no re-registration needed
  //   • new socket (token change) → new socket also gets the same dispatcher
  //   • components register once, survive all reconnects
  const notifHandlersRef = useRef(new Set());

  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!token || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      return;
    }

    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL || "https://crewsync-ai.onrender.com";

    const socket = io(SOCKET_URL, {
      auth:       { token },
      transports: ["websocket", "polling"],
      reconnection:         true,
      reconnectionAttempts: 10,
      reconnectionDelay:    1000,
      reconnectionDelayMax: 5000,
      timeout:              20000,
    });

    // ── Core lifecycle ────────────────────────────────────
    socket.on("connect", () => {
      setIsConnected(true);
      console.log("🔌 Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      console.log("🔌 Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("🔌 Socket connect error:", err.message);
      setIsConnected(false);
    });

    // ── Notification dispatcher ───────────────────────────
    // One listener per socket instance; dispatches to all registered handlers.
    // Using the ref means the dispatcher itself is stable even if handlers change.
    socket.on("notification:new", (notification) => {
      notifHandlersRef.current.forEach((handler) => {
        try { handler(notification); } catch (e) { console.error("notification handler error:", e); }
      });
    });

    // ── Presence ──────────────────────────────────────────
    socket.on("user:offline", ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== userId));
    });

    socketRef.current = socket;

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("notification:new");
      socket.off("user:offline");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user]);

  // ── onNotification — stable subscription API ─────────────
  // Usage:  useEffect(() => onNotification(handler), [onNotification])
  // Returns an unsubscribe function suitable as a useEffect cleanup.
  const onNotification = useCallback((handler) => {
    notifHandlersRef.current.add(handler);
    return () => { notifHandlersRef.current.delete(handler); };
  }, []); // empty deps — this function never changes

  // ── Project room helpers ──────────────────────────────────
  const joinProject     = useCallback((pid) => socketRef.current?.emit("project:join",  pid), []);
  const leaveProject    = useCallback((pid) => socketRef.current?.emit("project:leave", pid), []);
  const sendTypingStart = useCallback((pid) => socketRef.current?.emit("typing:start",  { projectId: pid }), []);
  const sendTypingStop  = useCallback((pid) => socketRef.current?.emit("typing:stop",   { projectId: pid }), []);
  const emitTaskMove    = useCallback((pid, tid, status, pos) =>
    socketRef.current?.emit("task:move", { projectId: pid, taskId: tid, newStatus: status, position: pos }), []);

  // ── Generic event helpers (for project workspace) ─────────
  // These are stable refs — they read socketRef.current lazily at call time,
  // so they work even after reconnects without being recreated.
  const on  = useCallback((event, cb) => { socketRef.current?.on(event,  cb); }, []);
  const off = useCallback((event, cb) => { socketRef.current?.off(event, cb); }, []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      onlineUsers,
      onNotification,   // ← subscribe to notification:new safely
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
