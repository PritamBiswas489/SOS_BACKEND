/**
 * Socket.IO server setup and configuration.
 */
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { registerChatHandlers } from "./chatHandler.js";
import { registerTypingHandlers } from "./typingHandler.js";
import { registerStatusHandlers } from "./statusHandler.js";
import { registerPresenceHandlers } from "./presenceHandler.js";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
let io;
const connectedUsers = new Map();

export const getIO = () => io;

export const getConnectedUsers = () => connectedUsers;

export const getSocketIdsForUser = (userId) => {
  return connectedUsers.get(userId) || new Set();
};

const verifyToken = (token) => {
  return jwt.verify(token, "a-string-secret-at-least-256-bits-long");
};

export const initSocketServer = async (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
    maxHttpBufferSize: 1e7, // 10 MB for media chunk fallback
    transports: ["websocket", "polling"],
  });

  // Use your environment variables as in your config
  const pubClient = createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    },
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    database: process.env.REDIS_DATABASE
      ? Number(process.env.REDIS_DATABASE)
      : 0,
  });
  const subClient = pubClient.duplicate();

  pubClient.on("connect", () => console.log("✅ Redis pubClient connected"));
  pubClient.on("ready", () => console.log("✅ Redis pubClient ready"));
  pubClient.on("error", (err) =>
    console.error("❌ Redis pubClient error:", err),
  );

  subClient.on("connect", () => console.log("✅ Redis subClient connected"));
  subClient.on("ready", () => console.log("✅ Redis subClient ready"));
  subClient.on("error", (err) =>
    console.error("❌ Redis subClient error:", err),
  );

  await pubClient.connect();
  await subClient.connect();

  io.adapter(createAdapter(pubClient, subClient));

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.headers["token"];
      console.log(
        `Socket ${socket.id} attempting to authenticate with token: ${token}`,
      );
      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      socket.userName = decoded.userName;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });
  io.on("connection", async (socket) => {
    const { userId, userName } = socket;
    console.log(
      `🔌 [Socket] User connected: ${userName} (${userId}) — socket ${socket.id}`,
    );
    // Track connected sockets per user (multi-device support)
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);

    socket.on("join:room", async (payload) => {
      const { roomId } = JSON.parse(payload);
      await socket.join(roomId); // Await this!
      console.log(
        `User ${socket.userName} with ID ${socket.userId} joined room ${roomId}`,
      );
      const clients = await io.in(roomId).allSockets();
      console.log(`Sockets in room ${roomId}:`, clients);
    });
    //Register chat-related event handlers
    registerChatHandlers(io, socket);
    //Register typing-related event handlers
    registerTypingHandlers(io, socket);
    //Register status-related event handlers
    registerStatusHandlers(io, socket);
    //Register presence-related event handlers
    registerPresenceHandlers(io, socket);

    // Notify contacts that user is online
    socket.broadcast.emit("user:online", { userId, userName });

    socket.on('disconnect', async (reason) => {
      console.log(`[Socket] User disconnected: ${userName} (${userId}) — ${reason}`);
      const sockets = connectedUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          connectedUsers.delete(userId);
          // Update DB presence
          // try {
          //   const { User } = await import('../models/index.js');
          //   await User.update({ isOnline: false, lastSeen: new Date() }, { where: { id: userId } });
          // } catch (err) {
          //   console.error('[Socket] Failed to update offline status', err);
          // }

          // Only broadcast offline when ALL devices disconnect
          io.emit('user:offline', { userId, lastSeen: new Date().toISOString() });
        }
      }
    });
  });
};
