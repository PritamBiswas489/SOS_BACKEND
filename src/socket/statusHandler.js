import ChatService from "../services/chat.service.js";
export const registerStatusHandlers = (io, socket) => {
  // Handler for message delivery status updates
  socket.on("message:delivered", async (payload) => {
    try {
    console.log("[Status] Received message:delivered for payload:", payload);
    const { messageId, senderId } = JSON.parse(payload);
    if (!messageId || !senderId) return;
    const message = await ChatService.getMessageDetails(messageId);

    if (!message) {
      console.warn(`[Status] Message with ID ${messageId} not found in DB`);
      return;
    }
    try {
      console.log(`[Status] Message details for ID ${messageId}:`);
      // Update message status in DB (only escalate, never downgrade)
      await ChatService.updateMessageStatus(messageId, "delivered");
      // Create/update receipt
      await ChatService.saveMessageReceipt({
        messageId,
        userId: socket.userId,
        status: "delivered",
      });
    } catch (err) {
      console.error("[Status] message:delivered DB error", err);
    }
    io.to(message.room_id).emit("message:status", {
      messageId,
      status: "delivered",
      updatedBy: socket.userId,
      timestamp: new Date().toISOString(),
    });
    } catch (err) {
      console.error("[Status] message:delivered error", err);
    }
  });
  // Similar handler for "message:read" event
  socket.on("message:read", async (payload) => {
    try {
    console.log("[Status]dd Received message:read for payload:", payload);
    const { messageIds, senderId } = JSON.parse(payload);
    if (!messageIds || !senderId) return;

    for (const messageId of messageIds) {
      const message = await ChatService.getMessageDetails(messageId);
      if (!message) {
        console.warn(`[Status] Message with ID ${messageId} not found in DB`);
        continue;
      }
      try {
        console.log(`[Status] Message details for ID ${messageId}:`);
        // Update message status in DB (only escalate, never downgrade)
        await ChatService.updateMessageStatus(messageId, "read");
        // Create/update receipt
        await ChatService.saveMessageReceipt({
          messageId,
          userId: socket.userId,
          status: "read",
        });
      } catch (err) {
        console.error("[Status] message:read DB error", err);
      }
      io.to(message.room_id).emit("message:status", {
        messageId,
        status: "read",
        updatedBy: socket.userId,
        timestamp: new Date().toISOString(),
      });
    }
    } catch (err) {
      console.error("[Status] message:read error", err);
    }
  });
  
};
