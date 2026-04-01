import moment from "moment";
import { getSocketIdsForUser } from "./index.js";
import ChatService from "../services/chat.service.js";
import { promisify } from "../libraries/utility.js";
export const registerChatHandlers = (io, socket) => {
  socket.on("message:send", async (load, ack) => {
    try {
      const payload = JSON.parse(load);
      const {
        roomId,
        recipientId,
        text,
        mediaUrl = null,
        mediaType = null,
        replyTo = null,
      } = payload;

      // Basic validation
      if (!recipientId || (!text && !mediaUrl)) {
        if (typeof ack === "function") {
          return ack({
            success: false,
            error: "recipientId and text or mediaUrl required",
          });
        }
        return;
      }
      const dbMessage = await promisify(
        ChatService.saveChatMessage.bind(ChatService),
        {
          sender_id: socket.userId,
          recipient_id: recipientId,
          room_id: roomId,
          text,
          media_url: mediaUrl,
          media_type: mediaType,
          reply_to: replyTo,
        },
      );

      // Create message object
      const message = {
        id: dbMessage.id, // Use the generated unique ID
        senderId: socket.userId,
        senderName: socket.userName,
        recipientId: dbMessage.recipient_id,
        text: dbMessage.text,
        mediaUrl: dbMessage.media_url,
        mediaType: dbMessage.media_type,
        replyTo: dbMessage.reply_to,
        status: dbMessage.status,
        timestamp: moment().toISOString(),
      };

      const clients = await io.in(roomId).allSockets();
      console.log(`Sockets in room ${roomId}:`, clients);

      console.log("MESSAGE SEND PAYLOAD:", message);
      console.log(`EMITTING MESSAGE TO ROOM: ${roomId}`);

      // Emit message to recipient's rooms
      io.to(`${roomId}`).emit("message:new", message);
      const senderSockets = getSocketIdsForUser(socket.userId);
      for (const sid of senderSockets) {
        if (sid !== socket.id) {
          io.to(sid).emit("message:new", { ...message, isSelf: true });
        }
      }
      if (typeof ack === "function") {
        ack({ success: true, message });
      }
      const recipientSockets = getSocketIdsForUser(recipientId);
      if (recipientSockets.size > 0) {
        await dbMessage.update({ status: "delivered" });
        // Notify sender that message was delivered
        io.to(`${roomId}`).emit("message:status", {
          messageId: dbMessage.id,
          status: "delivered",
          timestamp: moment().toISOString(),
        });
      } else {
        //Push notification logic can be implemented here for offline users
        console.log(
          `User ${recipientId} is offline. Consider sending a push notification.`,
        );
      }
    } catch (err) {
      console.error("[Chat] message:send error", err);
      if (typeof ack === "function") {
        ack?.({ success: false, error: "Failed to send message" });
      }
    }
  });
  socket.on("message:history", async (payload, ack) => {
    try {
      const { roomId, limit = 50, before } = JSON.parse(payload);
      const messages = await ChatService.getChatHistory(roomId, limit, before);
      if (typeof ack === "function") {
        ack({ success: true, messages });
      }
    } catch (err) {
      if (typeof ack === "function") {
        ack({ success: false, error: "Failed to fetch chat history" });
      }
    }
  });
};
