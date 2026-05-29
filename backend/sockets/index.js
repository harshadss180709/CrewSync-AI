import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const initSockets = (io) => {
  // ── Auth middleware for sockets ───────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Authentication error"));
      const decoded  = jwt.verify(token, process.env.JWT_SECRET);
      socket.user    = await User.findById(decoded.id).select("-password");
      if (!socket.user) return next(new Error("User not found"));
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.id})`);

    // ── Presence ────────────────────────────────────────
    socket.join(`user:${socket.user._id}`);

    // ── Join project room ────────────────────────────────
    socket.on("project:join", (projectId) => {
      socket.join(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit("user:joined", {
        userId: socket.user._id,
        name:   socket.user.name,
        avatar: socket.user.avatar,
      });
      console.log(`📁 ${socket.user.name} joined project ${projectId}`);
    });

    // ── Leave project room ───────────────────────────────
    socket.on("project:leave", (projectId) => {
      socket.leave(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit("user:left", {
        userId: socket.user._id,
        name:   socket.user.name,
      });
    });

    // ── Typing indicator ─────────────────────────────────
    socket.on("typing:start", ({ projectId }) => {
      socket.to(`project:${projectId}`).emit("typing:start", {
        userId: socket.user._id,
        name:   socket.user.name,
        avatar: socket.user.avatar,
      });
    });

    socket.on("typing:stop", ({ projectId }) => {
      socket.to(`project:${projectId}`).emit("typing:stop", {
        userId: socket.user._id,
      });
    });

    // ── Direct message ───────────────────────────────────
    socket.on("dm:send", ({ recipientId, message }) => {
      io.to(`user:${recipientId}`).emit("dm:receive", {
        from:    socket.user._id,
        name:    socket.user.name,
        avatar:  socket.user.avatar,
        message,
        sentAt:  new Date(),
      });
    });

    // ── Task board live update ───────────────────────────
    socket.on("task:move", ({ projectId, taskId, newStatus, position }) => {
      socket.to(`project:${projectId}`).emit("task:moved", {
        taskId, newStatus, position,
        movedBy: { id: socket.user._id, name: socket.user.name },
      });
    });

    // ── File upload notification ─────────────────────────
    socket.on("file:uploaded", ({ projectId, file }) => {
      socket.to(`project:${projectId}`).emit("file:new", {
        file,
        uploadedBy: { id: socket.user._id, name: socket.user.name },
      });
    });

    // ── Online users in project ──────────────────────────
    socket.on("project:whosonline", async (projectId) => {
      const sockets = await io.in(`project:${projectId}`).fetchSockets();
      const online  = sockets.map(s => ({ id: s.user._id, name: s.user.name, avatar: s.user.avatar }));
      socket.emit("project:onlineusers", online);
    });

    // ── Disconnect ───────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`🔌 Disconnected: ${socket.user?.name}`);
      // Broadcast offline only to rooms this user was in (not global broadcast)
      const rooms = [...socket.rooms].filter(r => r.startsWith("project:"));
      rooms.forEach(room => {
        socket.to(room).emit("user:offline", { userId: socket.user._id });
      });
      // Also notify the user's personal room subscribers
      socket.to(`user:${socket.user._id}`).emit("user:offline", { userId: socket.user._id });
    });
  });
};
