/**
 * Socket.IO server setup and configuration.
 */
import "../config/environment.js"
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { generateToken } from "../libraries/auth.js";
import UserService from "../services/user.service.js";
import { registerChatHandlers } from "./chatHandler.js";
import { registerTypingHandlers } from "./typingHandler.js";
import { registerStatusHandlers } from "./statusHandler.js";
import { registerPresenceHandlers } from "./presenceHandler.js";
import { registerTrustedContactHandler } from "./trustedContacthandler.js";
import { registerLocationHandlers } from "./locationHandler.js";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import ChatService from "../services/chat.service.js";
let io;
const connectedUsers = new Map();

export const getIO = () => io;

export const getConnectedUsers = () => connectedUsers;

export const getSocketIdsForUser = (userId) => {
  return connectedUsers.get(userId) || new Set();
};

const { ACCESS_TOKEN_SECRET_KEY, REFRESH_TOKEN_SECRET_KEY, JWT_ALGO, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = process.env;

const verifyToken = (token) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET_KEY);
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
      console.log(socket.handshake.headers);
      const token =  socket?.handshake?.auth?.token  || socket.handshake.headers["token"];
      const refreshToken = socket?.handshake?.auth?.refreshToken  || socket?.handshake?.headers["refreshtoken"];
      console.log(
        `Socket ${socket.id} attempting to authenticate with token: ${token} refreshToken: ${refreshToken}`,
      );

      if (!token) {
        return next(new Error("Token not provided"));
      }

      let decoded;
      let newAccessToken = null;
      let newRefreshToken = null;

      try {
        // Try verifying the access token first
        decoded = verifyToken(token);
      } catch (tokenErr) {
        // Access token failed — try refresh token
        if (!refreshToken) {
          return next(new Error("Access token expired and no refresh token provided"));
        }

        try {
          decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET_KEY);
        } catch (refreshErr) {
          return next(new Error("Both access and refresh tokens are invalid"));
        }
        // Generate new tokens
        const payload = {
          id: decoded.id,
					phoneNumber: decoded.phone_number,
					name: decoded.name,
					email: decoded.email,
					role: decoded.role,
        };

        newAccessToken = await generateToken(payload, JWT_ALGO, ACCESS_TOKEN_SECRET_KEY, Number(ACCESS_TOKEN_EXPIRES_IN));
        newRefreshToken = await generateToken(payload, JWT_ALGO, REFRESH_TOKEN_SECRET_KEY, Number(REFRESH_TOKEN_EXPIRES_IN));
      }

      if (!decoded || !decoded.id) {
        return next(new Error("Invalid token payload"));
      }
      // Validate user exists, is active, and has correct role
      const user = await UserService.getUserById(decoded.id);
      if (!user) {
        return next(new Error("User not found"));
      }
      if (!user.is_active) {
        return next(new Error("Account deactivated by system admin"));
      }
      if (user.role !== "USER") {
        return next(new Error("Unauthorized role"));
      }

      console.log("========================================================================");
      console.log("decoded", decoded);
      socket.userId = decoded.id;
      socket.userName = decoded.name || decoded.phoneNumber;

      // If tokens were refreshed, emit new tokens to the client after connection
      if (newAccessToken && newRefreshToken) {
        socket.newAccessToken = newAccessToken;
        socket.newRefreshToken = newRefreshToken;
      }
      next();
    } catch (err) {
      console.error("❌ Socket authentication error:", err);
      next(new Error("Authentication failed"));
    }
  });
  io.on("connection", async (socket) => {
    const { userId, userName } = socket;
    console.log(
      `🔌 [Socket] User connected: ${userName} (${userId}) — socket ${socket.id}`,
    );

    // Emit refreshed tokens if they were regenerated during auth
    if (socket.newAccessToken && socket.newRefreshToken) {
      socket.emit("token:refreshed", {
        accessToken: socket.newAccessToken,
        refreshToken: socket.newRefreshToken,
      }); 
    }

    // Track connected sockets per user (multi-device support)
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);

    //Joining personal room for direct messages and status updates
    

    socket.on('join:personal', async () => {
      const personalRoom = `app-user:${userId}`;
      await socket.join(personalRoom);
      socket.emit('personal:room:joined', { room: personalRoom });
   });

    
     

    socket.on("join:room", async (payload) => {
      const { roomId } = JSON.parse(payload);
      
      // Check if socket is already in the room
      if (socket.rooms.has(roomId)) {
      console.log(
        `User ${socket.userName} (${socket.userId}) already joined room ${roomId}`,
      );
      return;
      }
      
      await socket.join(roomId);
      console.log(
      `User ${socket.userName} with ID ${socket.userId} joined room ${roomId}`,
      );
      const clients = await io.in(roomId).allSockets();
      console.log(`Sockets in room ${roomId}:`, clients);
    });

    // Register event handlers for trusted contact requests
    try {
      await ChatService.updateUserOnlineStatus(socket.userId, true);
    } catch (err) {
      console.error(`❌ Failed to update online status for user ${userId}:`, err);
    }

    //Register chat-related event handlers
    registerChatHandlers(io, socket);
    //Register typing-related event handlers
    registerTypingHandlers(io, socket);
    //Register status-related event handlers
    registerStatusHandlers(io, socket);
    //Register presence-related event handlers
    registerPresenceHandlers(io, socket);
    //Register trusted contact-related event handlers
    registerTrustedContactHandler(io, socket);
    //Register location-related event handlers
    registerLocationHandlers(io, socket);

    // Notify contacts that user is online
    socket.broadcast.emit("user:online", { userId, userName });

    socket.on('disconnect', async (reason) => {
      console.log(`[Socket] User disconnected: ${userName} (${userId}) — ${reason}`);
      const sockets = connectedUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          connectedUsers.delete(userId);
            await ChatService.updateUserOnlineStatus(socket.userId, false);

          // Only broadcast offline when ALL devices disconnect
          io.emit('user:offline', { userId, lastSeen: new Date().toISOString() });
        }
      }
    });
  });
};
