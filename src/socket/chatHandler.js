import moment from "moment";
import ChatService from "../services/chat.service.js";
import { promisify } from "../libraries/utility.js";
import UserService from "../services/user.service.js";
import TrustedContactService from "../services/trustedContact.service.js";
import { enqueueBulk } from "../queues/notificationQueue.js";
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
        locationJson = null,
      } = payload;

      console.log("Received message:send with payload:", payload);

      // Basic validation
      if (!recipientId || (!text && !mediaUrl && !locationJson)) {
        if (typeof ack === "function") {
          return ack({
            success: false,
            error: "recipientId and at least one of text, mediaUrl, or current location is required",
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
          location_json: locationJson,
        },
      );
      let replyToMessage = null;
      if(replyTo){  
          replyToMessage = await ChatService.getMessageDetails(replyTo);
      }
      let trustedContact = null;
       trustedContact = await promisify(
        TrustedContactService.getTrustedContactDetailsByUserIdAndTrustedContactId.bind(TrustedContactService),
        { userid: dbMessage.recipient_id, payload: { trustedContactId: socket.userId }, headers: {} },
      ).catch((err) => {});
      console.log("Trusted contact details:", trustedContact);
      let senderName = socket.userName;
      if(trustedContact?.data?.nickname){
        senderName = trustedContact.data.nickname;
      }
      // Create message object
      const message = {
        id: dbMessage.id, // Use the generated unique ID
        roomId: dbMessage.room_id,
        senderId: socket.userId,
        senderName: senderName,
        recipientId: dbMessage.recipient_id,
        text: dbMessage.text,
        mediaUrl: dbMessage.media_url,
        mediaType: dbMessage.media_type,
        replyTo: dbMessage.reply_to,
        reply_to_message: replyToMessage,
        status: dbMessage.status,
        timestamp: moment().toISOString(),
        locationJson: dbMessage.location_json,
      };

      const clients = await io.in(roomId).allSockets();
      console.log(`Sockets in room ${roomId}:`, clients);

      console.log("MESSAGE SEND PAYLOAD:", message);
      console.log(`EMITTING MESSAGE TO ROOM: ${roomId}`);

      // Emit message to recipient's rooms
      console.log(`Emitting message:new to room ${roomId} with message:`, message);
      io.to(`${roomId}`).emit("message:new", message);
      if (typeof ack === "function") {
        ack({ success: true, message });
      }
      const recipientSockets =   await io.in(`app-user:${recipientId}`).allSockets();
      console.log("Recipient sockets:", recipientSockets);
      if (recipientSockets.size > 0) {
        console.log(`User ${recipientId} is online. Marking message as delivered.`);
        await dbMessage.update({ status: "delivered" });
        // Notify sender that message was delivered
        io.to(`${roomId}`).emit("message:status", {
          messageId: dbMessage.id,
          status: "delivered",
          timestamp: moment().toISOString(),
        });
      } else {
        //Push notification logic can be implemented here for offline users
        let recipientDeviceTokens = [];
        try{
          recipientDeviceTokens = await promisify(
          UserService.getUserDeviceTokens.bind(UserService),
          recipientId,
        );

        }catch(err){

        }
        
        if(recipientDeviceTokens && recipientDeviceTokens.length > 0){
          const notificationTitle = `New message from ${senderName}`;
          const notificationBody = text ? text : "Sent you a new message";
          enqueueBulk(recipientDeviceTokens, {
            title: notificationTitle,
            body: notificationBody,
            data: {
               messageType:'CHAT_MESSAGE',
            }
          });
        }
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
      const { roomId, limit = 50, page = 1 } = JSON.parse(payload);
      const messages = await ChatService.getChatHistory(roomId, limit, page);
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
